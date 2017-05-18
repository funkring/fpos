package at.oerp.pos;

import com.google.zxing.common.BitMatrix;

import android.graphics.Bitmap;
import android.graphics.Color;
import at.oerp.util.PrinterImage;

public final class BitMatrixImage implements PrinterImage {

	final BitMatrix data;
	Bitmap bitmap;
	
	public BitMatrixImage(BitMatrix inData) {
		data = inData;
	}
	
	@Override
	public int getWidth() {
		return data.getWidth();
	}

	@Override
	public int getHeight() {
		return data.getHeight();
	}

	@Override
	public boolean isBlack(int x, int y) {
		return data.get(x, y);
	}

	@Override
	public Bitmap getBitmap() {
		if ( bitmap == null ) {
			int height = data.getHeight();
			int width = data.getWidth();
			bitmap = Bitmap.createBitmap(height, width, Bitmap.Config.RGB_565);
			for ( int x=0; x < width; x++) {
				for ( int y=0; y < height; y++) {
					bitmap.setPixel(x, y, data.get(x, y) ? Color.BLACK : Color.WHITE);
				}
			}
		}
		return bitmap;
	}

}
