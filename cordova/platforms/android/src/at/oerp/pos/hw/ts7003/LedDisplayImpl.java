package at.oerp.pos.hw.ts7003;

import java.io.IOException;

import android.app.Application;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.Paint.Style;
import android.pt.minilcd.MiniLcd;
import at.oerp.pos.PosHwDisplay;
import at.oerp.util.StringUtil;

public class LedDisplayImpl extends PosHwDisplay {

	final static String LINE_TEMPLATE = "-1.000.000,00 €";
	
	final MiniLcd lcd;
	final TS7003PosService posService;
	
	final Bitmap  textImage;
	final Paint   textPaint;
	final Canvas  textCanvas;
	
	final int lineHeight;
	final int lineWidth;
	final int lineChars;
	final int lineVSpace;
	
	int textX = 462;
	int textY = 244;
	
	public LedDisplayImpl(TS7003PosService inPosService) {
		posService = inPosService;
		lcd = new MiniLcd();
	
		// load BACKGROUND
		
		Application app = posService.getApplication();
		Resources res = app.getResources();
		int backgroundImageId = app.getResources().getIdentifier("display_ts7003", "drawable", app.getPackageName());
		
		BitmapFactory.Options options = new BitmapFactory.Options();
		options.inScaled = false;
		Bitmap backgroundImage = BitmapFactory.decodeResource(res, backgroundImageId, options);
		
		if ( lcd.open() == 0 ) {
			try {
				lcd.fullScreen(Color.BLACK);
				lcd.displayPicture(0, 0, backgroundImage);
			} finally {
				lcd.close();
			}
		}
		
		// define TEXT paint
		
		textPaint = new Paint();
		textPaint.setColor(Color.WHITE);
		textPaint.setStyle(Style.FILL);
		textPaint.setTextSize(36);
		textPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
	
		lineHeight = (int) textPaint.getFontSpacing(); 
		lineWidth = Math.round(textPaint.measureText(LINE_TEMPLATE));
		lineChars = LINE_TEMPLATE.length(); 
		
		textImage = Bitmap.createBitmap(lineWidth, lineHeight, Bitmap.Config.ARGB_4444);
		textCanvas = new Canvas(textImage);
		textX -= textImage.getWidth();
		textY = backgroundImage.getHeight() - textY - lineHeight;
		lineVSpace = (Math.round((lineHeight - textPaint.measureText("yY")))*2);
	}
	
	@Override
	public int getCharsPerLine() {
		return LINE_TEMPLATE.length();
	}

	@Override
	public int getLines() {
		return 1;
	}

	/**
	 * set boot image
	 * @param inBootImage
	 */
	public void setBootImage(Bitmap inBootImage) {
		if ( lcd.open() == 0 ) {
			try {
				lcd.downloadBootPicture(inBootImage, 1);
				lcd.displayBootPicture(1, 0, 0);
			} finally {
				lcd.close();
			}
		}
	}
	
	@Override
	public boolean setDisplay(String... inLines) throws IOException {
		
		String line = "";
		if ( inLines != null && inLines.length > 0 ) {
			line = StringUtil.formatRight(inLines[0], getCharsPerLine(), ' ');
		}
		
		if ( lcd.open() == 0 ) {
			try {
				textCanvas.drawColor(Color.BLACK);
				textCanvas.drawText(line, lineWidth-textPaint.measureText(line), lineHeight-lineVSpace, textPaint);
				lcd.displayPicture(textX, textY, textImage);
				return true;
			} finally {
				lcd.close();
			}
		}
		
		return false;
	}
	
	@Override
	public void close() {
	}

	@Override
	public boolean fullCharset() {
		return true;
	}
}
