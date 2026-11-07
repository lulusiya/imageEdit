package com.xiaoying.imageedit.service.execution;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Task;
import com.xiaoying.imageedit.domain.TaskStage;
import com.xiaoying.imageedit.storage.MediaStore;
import com.xiaoying.imageedit.storage.ResultStore;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Component;

/**
 * Renders the simulated final artifact from the uploaded asset. No AI service is used:
 * the portrait photo is placed inside a deterministic 9:16 template mask with a title,
 * frame and timestamp so the demo always has a predictable output.
 */
@Component
public class Java2dResultComposer implements ResultComposer {

    private static final int WIDTH = 1080;
    private static final int HEIGHT = 1920;
    private static final Color FALLBACK_ACCENT = new Color(0xA7C957);

    private final MediaStore mediaStore;
    private final ResultStore resultStore;

    public Java2dResultComposer(MediaStore mediaStore, ResultStore resultStore) {
        this.mediaStore = mediaStore;
        this.resultStore = resultStore;
    }

    @Override
    public String compose(Task task, List<Asset> assets) {
        Color accent = parseColor(task.getAccentColor());
        BufferedImage canvas = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = canvas.createGraphics();
        try {
            configure(g);
            drawBackground(g, accent);
            drawTemplateMask(g, assets, accent);
            drawHeader(g, task, accent);
            drawFooter(g, task, accent);
        } finally {
            g.dispose();
        }

        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(canvas, "png", output);
            return resultStore.saveResult(task.getId(), output.toByteArray());
        } catch (IOException ex) {
            throw new StageFailureException(TaskStage.FINALIZE, "结果整理失败：写入成品图片时发生错误。", ex);
        }
    }

    private void configure(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
    }

    private void drawBackground(Graphics2D g, Color accent) {
        g.setPaint(new GradientPaint(0, 0, new Color(0x1B1D23), WIDTH, HEIGHT, new Color(0x0A0B0D)));
        g.fillRect(0, 0, WIDTH, HEIGHT);

        g.setComposite(java.awt.AlphaComposite.SrcOver.derive(0.10f));
        g.setColor(accent);
        g.fillOval(760, -320, 900, 900);
        g.fillOval(-340, 1240, 820, 820);
        g.setComposite(java.awt.AlphaComposite.SrcOver);

        g.setColor(new Color(255, 255, 255, 10));
        g.setStroke(new BasicStroke(1f));
        for (int x = 72; x <= WIDTH - 72; x += 96) {
            g.drawLine(x, 0, x, HEIGHT);
        }
        for (int y = 0; y <= HEIGHT; y += 96) {
            g.drawLine(0, y, WIDTH, y);
        }
    }

    private void drawTemplateMask(Graphics2D g, List<Asset> assets, Color accent) {
        int x = 36;
        int y = 36;
        int width = WIDTH - 72;
        int height = HEIGHT - 72;
        int radius = 40;
        RoundRectangle2D mask = new RoundRectangle2D.Float(x, y, width, height, radius, radius);

        Shape oldClip = g.getClip();
        g.setClip(mask);
        if (assets.size() <= 1) {
            drawCover(g, loadImage(assets.get(0)), x, y, width, height);
        } else {
            int gap = 24;
            int half = (height - gap) / 2;
            drawCover(g, loadImage(assets.get(0)), x, y, width, half);
            drawCover(g, loadImage(assets.get(1)), x, y + half + gap, width, half);
        }

        g.setPaint(new GradientPaint(0, y, new Color(0, 0, 0, 130), 0, y + 360, new Color(0, 0, 0, 0)));
        g.fillRect(x, y, width, 380);
        g.setPaint(new GradientPaint(0, y + height * 0.62f, new Color(0, 0, 0, 0), 0, y + height, new Color(0, 0, 0, 205)));
        g.fillRect(x, y + (int) (height * 0.62f), width, height - (int) (height * 0.62f));
        g.setClip(oldClip);

        g.setStroke(new BasicStroke(2f));
        g.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 170));
        g.draw(mask);
        drawCornerTicks(g, x, y, width, height);
    }

    private void drawCornerTicks(Graphics2D g, int x, int y, int width, int height) {
        int inset = 28;
        int length = 44;
        g.setColor(new Color(255, 255, 255, 210));
        g.setStroke(new BasicStroke(2.4f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        int left = x + inset;
        int right = x + width - inset;
        int top = y + inset;
        int bottom = y + height - inset;
        g.drawLine(left, top, left + length, top);
        g.drawLine(left, top, left, top + length);
        g.drawLine(right, top, right - length, top);
        g.drawLine(right, top, right, top + length);
        g.drawLine(left, bottom, left + length, bottom);
        g.drawLine(left, bottom, left, bottom - length);
        g.drawLine(right, bottom, right - length, bottom);
        g.drawLine(right, bottom, right, bottom - length);
    }

    private void drawHeader(Graphics2D g, Task task, Color accent) {
        g.setColor(accent);
        g.fillRoundRect(84, 112, 64, 8, 8, 8);

        String caption = task.getResultCaption() == null || task.getResultCaption().isBlank()
                ? "IMAGEEDIT CREATION"
                : task.getResultCaption().toUpperCase();

        int fontSize = 56;
        Font font = new Font(Font.SANS_SERIF, Font.BOLD, fontSize);
        while (fontSize > 30) {
            FontMetrics metrics = g.getFontMetrics(font);
            if (metrics.stringWidth(caption) <= WIDTH - 240) {
                break;
            }
            fontSize -= 2;
            font = new Font(Font.SANS_SERIF, Font.BOLD, fontSize);
        }
        g.setFont(font);
        g.setColor(new Color(0xF7F8FA));
        g.drawString(caption, 84, 196);

        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 20));
        g.setColor(new Color(0xD5D8DD));
        g.drawString("SIMULATED RESULT  ·  IMAGEEDIT STUDIO", 84, 234);

        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 22));
        g.setColor(accent);
        String id = String.format("#%04d", task.getId());
        FontMetrics metrics = g.getFontMetrics();
        g.drawString(id, WIDTH - 84 - metrics.stringWidth(id), 196);
    }

    private void drawCover(Graphics2D g, BufferedImage image, int x, int y, int width, int height) {
        double scale = Math.max((double) width / image.getWidth(), (double) height / image.getHeight());
        int drawWidth = (int) Math.ceil(image.getWidth() * scale);
        int drawHeight = (int) Math.ceil(image.getHeight() * scale);
        int offsetX = x + (width - drawWidth) / 2;
        int offsetY = y + (height - drawHeight) / 2;
        g.drawImage(image, offsetX, offsetY, drawWidth, drawHeight, null);
    }

    private BufferedImage loadImage(Asset asset) {
        try {
            byte[] bytes = mediaStore.read(asset.getStorageKey());
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) {
                throw new IOException("unsupported image content");
            }
            return image;
        } catch (IOException | RuntimeException ex) {
            throw new StageFailureException(TaskStage.FINALIZE,
                    "结果整理失败：素材图片无法解码。", ex);
        }
    }

    private void drawFooter(Graphics2D g, Task task, Color accent) {
        int lineY = HEIGHT - 176;
        g.setColor(new Color(255, 255, 255, 60));
        g.fillRect(84, lineY, WIDTH - 168, 1);

        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 20));
        g.setColor(new Color(0xD5D8DD));
        g.drawString("CREATED " + LocalDate.now(), 84, lineY + 50);

        g.setColor(accent);
        String right = "IMAGEEDIT · TASK " + task.getId();
        FontMetrics metrics = g.getFontMetrics();
        g.drawString(right, WIDTH - 84 - metrics.stringWidth(right), lineY + 50);
    }

    private static Color parseColor(String value) {
        if (value == null || value.isBlank()) {
            return FALLBACK_ACCENT;
        }
        try {
            return Color.decode(value.trim());
        } catch (NumberFormatException ex) {
            return FALLBACK_ACCENT;
        }
    }
}
