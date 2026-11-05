package com.xiaoying.imageedit.service.execution;

import com.xiaoying.imageedit.domain.Asset;
import com.xiaoying.imageedit.domain.Task;
import com.xiaoying.imageedit.domain.TaskStage;
import com.xiaoying.imageedit.storage.MediaStore;
import com.xiaoying.imageedit.storage.ResultStore;
import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
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
 * Renders the simulated final artifact from the uploaded assets. No AI service is used:
 * the output is a deterministic collage with a title, frame and timestamp.
 */
@Component
public class Java2dResultComposer implements ResultComposer {

    private static final int WIDTH = 1200;
    private static final int HEIGHT = 1500;
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
            drawHeader(g, task, accent);
            drawFrames(g, assets, accent);
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

        g.setComposite(AlphaComposite.SrcOver.derive(0.10f));
        g.setColor(accent);
        g.fillOval(820, -260, 780, 780);
        g.fillOval(-300, 900, 640, 640);
        g.setComposite(AlphaComposite.SrcOver);

        g.setColor(new Color(255, 255, 255, 10));
        g.setStroke(new BasicStroke(1f));
        for (int x = 90; x <= WIDTH - 90; x += 85) {
            g.drawLine(x, 0, x, HEIGHT);
        }
        for (int y = 0; y <= HEIGHT; y += 85) {
            g.drawLine(0, y, WIDTH, y);
        }
    }

    private void drawHeader(Graphics2D g, Task task, Color accent) {
        g.setColor(accent);
        g.fillRoundRect(90, 106, 84, 10, 10, 10);

        String caption = task.getResultCaption() == null || task.getResultCaption().isBlank()
                ? "IMAGEEDIT CREATION"
                : task.getResultCaption().toUpperCase();

        int fontSize = 54;
        Font font = new Font(Font.SANS_SERIF, Font.BOLD, fontSize);
        while (fontSize > 30) {
            FontMetrics metrics = g.getFontMetrics(font);
            if (metrics.stringWidth(caption) <= WIDTH - 220) {
                break;
            }
            fontSize -= 2;
            font = new Font(Font.SANS_SERIF, Font.BOLD, fontSize);
        }
        g.setFont(font);
        g.setColor(new Color(0xF3F4F6));
        g.drawString(caption, 90, 215);

        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 24));
        g.setColor(new Color(0x9AA0A8));
        g.drawString("SIMULATED RESULT  ·  IMAGEEDIT STUDIO", 90, 262);

        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 24));
        g.setColor(accent);
        String id = String.format("#%04d", task.getId());
        FontMetrics metrics = g.getFontMetrics();
        g.drawString(id, WIDTH - 90 - metrics.stringWidth(id), 215);
    }

    private void drawFrames(Graphics2D g, List<Asset> assets, Color accent) {
        int count = assets.size();
        if (count <= 1) {
            drawImageFrame(g, assets.get(0), 90, 330, 1020, 880, accent, "01");
            return;
        }
        drawImageFrame(g, assets.get(0), 90, 330, 1020, 420, accent, "01");
        drawImageFrame(g, assets.get(1), 90, 790, 1020, 420, accent, "02");
    }

    private void drawImageFrame(Graphics2D g, Asset asset, int x, int y, int width, int height,
                                Color accent, String label) {
        BufferedImage image = loadImage(asset);
        int radius = 26;

        RoundRectangle2D frame = new RoundRectangle2D.Float(x, y, width, height, radius, radius);
        g.setColor(new Color(255, 255, 255, 14));
        g.fill(frame);

        java.awt.Shape oldClip = g.getClip();
        g.setClip(frame);
        drawCover(g, image, x, y, width, height);
        g.setClip(oldClip);

        g.setStroke(new BasicStroke(2f));
        g.setColor(new Color(accent.getRed(), accent.getGreen(), accent.getBlue(), 150));
        g.draw(frame);

        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 20));
        g.setColor(new Color(255, 255, 255, 170));
        g.drawString(label, x + 24, y + 42);
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
        int lineY = 1335;
        g.setColor(new Color(255, 255, 255, 22));
        g.fillRect(90, lineY, WIDTH - 180, 1);

        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 22));
        g.setColor(new Color(0x9AA0A8));
        g.drawString("CREATED " + LocalDate.now(), 90, lineY + 52);

        g.setColor(accent);
        String right = "IMAGEEDIT · TASK " + task.getId();
        FontMetrics metrics = g.getFontMetrics();
        g.drawString(right, WIDTH - 90 - metrics.stringWidth(right), lineY + 52);
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
