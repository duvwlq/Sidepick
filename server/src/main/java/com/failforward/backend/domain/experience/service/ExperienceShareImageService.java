package com.failforward.backend.domain.experience.service;

import com.failforward.backend.domain.experience.entity.FailureExperience;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.font.FontRenderContext;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;

@Service
public class ExperienceShareImageService {

    private static final int WIDTH = 1200;
    private static final int HEIGHT = 630;
    private static final Color BACKGROUND_TOP = new Color(248, 241, 230);
    private static final Color BACKGROUND_BOTTOM = new Color(232, 215, 194);
    private static final Color PANEL = new Color(255, 252, 247, 235);
    private static final Color PANEL_BORDER = new Color(120, 93, 61, 40);
    private static final Color PRIMARY_TEXT = new Color(37, 29, 21);
    private static final Color SECONDARY_TEXT = new Color(102, 79, 58);
    private static final Color ACCENT = new Color(189, 92, 50);
    private static final Color CHIP_BACKGROUND = new Color(241, 226, 206);

    public byte[] renderPng(FailureExperience experience, String title, String description) {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            paintBackground(graphics);
            paintCard(graphics, experience, title, description);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(image, "png", outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to render share image.", exception);
        } finally {
            graphics.dispose();
        }
    }

    private void paintBackground(Graphics2D graphics) {
        graphics.setPaint(new GradientPaint(0, 0, BACKGROUND_TOP, WIDTH, HEIGHT, BACKGROUND_BOTTOM));
        graphics.fillRect(0, 0, WIDTH, HEIGHT);

        graphics.setColor(new Color(255, 255, 255, 50));
        graphics.fillOval(-120, -80, 460, 460);
        graphics.fillOval(820, 310, 340, 340);
        graphics.fillOval(930, -40, 200, 200);
    }

    private void paintCard(Graphics2D graphics, FailureExperience experience, String title, String description) {
        int cardX = 72;
        int cardY = 64;
        int cardWidth = WIDTH - 144;
        int cardHeight = HEIGHT - 128;

        graphics.setColor(PANEL);
        graphics.fill(new RoundRectangle2D.Double(cardX, cardY, cardWidth, cardHeight, 40, 40));
        graphics.setColor(PANEL_BORDER);
        graphics.setStroke(new BasicStroke(2f));
        graphics.draw(new RoundRectangle2D.Double(cardX, cardY, cardWidth, cardHeight, 40, 40));

        drawChip(graphics, cardX + 48, cardY + 42, safeValue(experience.getCategory().getName(), "Failure Case"));
        drawChip(graphics, cardX + 250, cardY + 42, safeValue(experience.getCaseStatus(), "FAILURE"));

        int textX = cardX + 48;
        int titleY = cardY + 148;
        graphics.setColor(PRIMARY_TEXT);
        graphics.setFont(new Font("SansSerif", Font.BOLD, 48));
        drawWrappedText(graphics, title, textX, titleY, cardWidth - 96, 2, 58);

        graphics.setColor(SECONDARY_TEXT);
        graphics.setFont(new Font("SansSerif", Font.PLAIN, 28));
        drawWrappedText(graphics, description, textX, cardY + 268, cardWidth - 120, 4, 38);

        graphics.setColor(ACCENT);
        graphics.setFont(new Font("SansSerif", Font.BOLD, 24));
        graphics.drawString("Sidepick", textX, cardY + cardHeight - 58);

        graphics.setColor(SECONDARY_TEXT);
        graphics.setFont(new Font("SansSerif", Font.PLAIN, 22));
        graphics.drawString("실패 경험 공유 카드", textX + 118, cardY + cardHeight - 58);
    }

    private void drawChip(Graphics2D graphics, int x, int y, String text) {
        graphics.setFont(new Font("SansSerif", Font.BOLD, 22));
        FontRenderContext context = graphics.getFontRenderContext();
        int chipWidth = (int) Math.ceil(graphics.getFont().getStringBounds(text, context).getWidth()) + 36;
        graphics.setColor(CHIP_BACKGROUND);
        graphics.fill(new RoundRectangle2D.Double(x, y, chipWidth, 42, 21, 21));
        graphics.setColor(ACCENT);
        graphics.draw(new RoundRectangle2D.Double(x, y, chipWidth, 42, 21, 21));
        graphics.drawString(text, x + 18, y + 28);
    }

    private void drawWrappedText(
            Graphics2D graphics,
            String text,
            int x,
            int y,
            int maxWidth,
            int maxLines,
            int lineHeight
    ) {
        List<String> lines = wrapText(graphics, safeValue(text, ""), maxWidth, maxLines);
        int currentY = y;
        for (String line : lines) {
            graphics.drawString(line, x, currentY);
            currentY += lineHeight;
        }
    }

    private List<String> wrapText(Graphics2D graphics, String text, int maxWidth, int maxLines) {
        List<String> lines = new ArrayList<>();
        if (text.isBlank()) {
            lines.add("");
            return lines;
        }

        String[] words = text.trim().split("\\s+");
        StringBuilder currentLine = new StringBuilder();
        for (String word : words) {
            String candidate = currentLine.isEmpty() ? word : currentLine + " " + word;
            int candidateWidth = graphics.getFontMetrics().stringWidth(candidate);
            if (candidateWidth <= maxWidth) {
                currentLine.setLength(0);
                currentLine.append(candidate);
                continue;
            }

            if (!currentLine.isEmpty()) {
                lines.add(currentLine.toString());
                if (lines.size() == maxLines) {
                    return trimLastLine(lines, maxWidth, graphics);
                }
                currentLine.setLength(0);
                currentLine.append(word);
                continue;
            }

            lines.add(trimWord(graphics, word, maxWidth));
            if (lines.size() == maxLines) {
                return trimLastLine(lines, maxWidth, graphics);
            }
        }

        if (!currentLine.isEmpty() && lines.size() < maxLines) {
            lines.add(currentLine.toString());
        }

        if (lines.isEmpty()) {
            lines.add("");
        }
        return lines;
    }

    private List<String> trimLastLine(List<String> lines, int maxWidth, Graphics2D graphics) {
        int lastIndex = lines.size() - 1;
        lines.set(lastIndex, trimWithEllipsis(graphics, lines.get(lastIndex), maxWidth));
        return lines;
    }

    private String trimWord(Graphics2D graphics, String word, int maxWidth) {
        return trimWithEllipsis(graphics, word, maxWidth);
    }

    private String trimWithEllipsis(Graphics2D graphics, String value, int maxWidth) {
        String ellipsis = "...";
        if (graphics.getFontMetrics().stringWidth(value) <= maxWidth) {
            return value;
        }

        String trimmed = value;
        while (!trimmed.isEmpty()
                && graphics.getFontMetrics().stringWidth(trimmed + ellipsis) > maxWidth) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed.isBlank() ? ellipsis : trimmed + ellipsis;
    }

    private String safeValue(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }
}
