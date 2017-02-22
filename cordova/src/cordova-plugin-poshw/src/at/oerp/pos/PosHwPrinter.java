package at.oerp.pos;

import java.io.IOException;
import java.util.HashMap;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import at.oerp.util.PrinterImage;
import at.oerp.util.LinePrintDriver;


public abstract class PosHwPrinter implements LinePrintDriver {
	
	protected HashMap<String, PrinterImage> imageCache;
	protected MultiFormatWriter multiFormatWriter;
	
	public abstract String getType();
	
	public abstract void printHtml(String inHtml) throws IOException;
	
	public abstract void printTest() throws IOException;
	
	public abstract void close();
	
	public PrinterImage prepareImage(PrinterImage inImage) throws IOException {
		return inImage;
	}
	
	public PrinterImage getImage(String inName, String inBase64) throws IOException {
		// check cache
		if ( inName != null ) {
			PrinterImage data = imageCache != null ? imageCache.get(inName) : null;
			if ( data == null  ) {
				if (inBase64 == null || inBase64.isEmpty())	throw new NoDataException();
			} else {
				return data;		
			}		
		}
		
		// check empty
		if ( inBase64 == null || inBase64.isEmpty() ) return null;
		
		// load image
		byte[] binaryImage = Base64.decode(inBase64, Base64.NO_WRAP);
		Bitmap image = BitmapFactory.decodeByteArray(binaryImage, 0, binaryImage.length);
		PrinterImage preparedImage = prepareImage(new BitmapImage(image));
		
		// cache if name was set
		if ( inName != null ) {
			if ( imageCache == null ) imageCache = new HashMap<String, PrinterImage>();
			imageCache.put(inName, preparedImage);
		}
		
		return preparedImage;		
	}
	
	public double getQRCodeSizeFactor() {
		return 0.5;
	}
			
	public void printQRCode(String inCode) throws IOException {
		if ( multiFormatWriter == null ) multiFormatWriter = new MultiFormatWriter();		
		int size = (int) (getPixel_mm() * getWidth_mm() * getQRCodeSizeFactor());
		try {
			BitMatrix qrCode = multiFormatWriter.encode(inCode, BarcodeFormat.QR_CODE, size, size);
			printImage(new BitMatrixImage(qrCode));
		} catch (WriterException e) {
			throw new IOException(e.getMessage(),e);
		}		
	}
	
}
