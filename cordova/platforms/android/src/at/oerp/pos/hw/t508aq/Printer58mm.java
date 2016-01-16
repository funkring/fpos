package at.oerp.pos.hw.t508aq;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.Charset;

import android.util.Log;
import android_serialport_api.SerialPort;
import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;

public class Printer58mm extends PosHwPrinter implements LinePrintDriver, CtrlBytes {

	// Printer Service Constants
	private final static String TAG = "Printer58mm";
	public final  double DOT_WIDTH_MM = 0.125; //mm
	
	public static final byte[] ESC_FONT_COLOR_DEFAULT = new byte[] { ESC, 'r', 0x00 };
	public static final byte[] ESC_FONT_LARGE =  new byte[] {ESC, M, 0};
	public static final byte[] ESC_FONT_MEDIUM = new byte[] {ESC, M, 1};
	public static final byte[] ESC_FONT_SMALL =  new byte[] {ESC, M, 2};
	public static final byte[] FS_FONT_ALIGN = new byte[] { FS, 0x21, 1, ESC, 0x21, 1 };
	public static final byte[] ESC_ALIGN_LEFT = new byte[] { 0x1b, 'a', 0x00 };
	public static final byte[] ESC_ALIGN_CENTER = new byte[] { 0x1b, 'a', 0x01 };
	public static final byte[] ESC_CANCEL_BOLD = new byte[] { ESC, 0x45, 0 };
	public static final byte[] ESC_ENABLE_BOLD = new byte[]{0x1B,0x6D,0x04};
	public static final byte[] ESC_ENTER = new byte[] { 0x1B, 0x4A, 0x40 };
	public static final byte[] PRINTER_TEST = new byte[] { 0x1D, 0x28, 0x41 };
	public static final byte[] SET_RIGHT = new byte[]{0x1B, 0x61, 0x02};
	public static final byte[] SET_LEFT = new byte[]{0x1B,0x61,0x00};
	
	// VARS
	
	private SerialPort port;
	private OutputStream output;
	private Charset unicode;
	
	/**
	 * constructor
	 * @throws SecurityException
	 * @throws IOException
	 */
	public Printer58mm() throws SecurityException, IOException {
		unicode = Charset.forName("unicode");
		port = new SerialPort(new File("/dev/ttyS3"), 115200, 0, 2);
		output = port.getOutputStream();
	}
	
	@Override
	public String getType() {
		return "58mm";
	}
	
	@Override
	public synchronized void printHtml(String inHtml, IObjectResolver inResolver) throws IOException {
		if ( port != null ) {
			HtmlLinePrinter printer = new HtmlLinePrinter(this, inResolver);
			printer.print(inHtml);
		}
	}
	

	@Override
	public void printTest() throws IOException {
		print(ESC_ENTER);
		print(ESC_ENTER);
		print(ESC_FONT_SMALL);
		printUnicode("Fetter Text!");
		printUnicode(" Und jetzt wieder normal");
		print(ESC_ENTER);
		print(ESC_ENTER);
	}
	
	protected void printUnicode(String data) throws IOException {
		if ( data == null )
			data = "";
		
		print(SET_LEFT);
		
		byte[] bData = data.getBytes(unicode);
		byte[] buf = new byte[2];
		
		for ( int i=buf.length; i < bData.length; i+=buf.length ) {
			buf[0] = bData[i+1];
			buf[1] = bData[i];
			output.write(buf);
		}
		
		output.flush();		
	}
		
	protected void sleep(int inMs) {
		try {
			Thread.sleep(inMs);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
	}
	
	protected void print(byte[] inData) throws IOException {
		if ( inData != null ) {
			output.write(inData);
			output.flush();
			sleep(50);
		}
	}
	
	protected void print(int inData) throws IOException {
		output.write(inData);
		output.flush();
	}

	@Override
	public synchronized void close() {
		if ( port != null ) {
			try {
				port.close();
			} catch (RuntimeException e ) {
				Log.e(TAG, e.getMessage());
			} finally {
				port = null;
				output = null;
			}
		}		
	}

	@Override
	public void printText(String inText) throws IOException {
		printUnicode(inText);
	}

	@Override
	public void lf() throws IOException {
		print(ESC_ENTER);
	}

	@Override
	public void reset() throws IOException {
		print(ESC_FONT_COLOR_DEFAULT);
		print(FS_FONT_ALIGN);
		print(ESC_ALIGN_LEFT);
		print(ESC_CANCEL_BOLD);
		print(LF);		
	}


	@Override
	public double getWidth_mm() throws IOException {
		return 48.0;
	}

	@Override
	public double getCharWidth_mm(int inFont, int inStyle) {
		switch ( inFont ) {
		case FONT_LARGE:
			return 24*DOT_WIDTH_MM;
		case FONT_DEFAULT: //medium
			return 16*DOT_WIDTH_MM;
		case FONT_SMALL:
			return 12*DOT_WIDTH_MM;
		}
		throw new IllegalArgumentException();
	}

	@Override
	public void setFont(int inFont) throws IOException {		
		switch ( inFont ) {
		case FONT_LARGE:
			print(ESC_FONT_LARGE);
			break;
		case FONT_DEFAULT:
			print(ESC_FONT_MEDIUM);
			break;
		case FONT_SMALL:
			print(ESC_FONT_SMALL);
			break;
		}
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
	}
	
}
