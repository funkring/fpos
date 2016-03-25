package at.oerp.pos.hw.t508aq;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.Charset;

import com.ctrl.gpio.GpioControl;
import com.ctrl.gpio.Ioctl;

import android.util.Log;
import android_serialport_api.SerialPort;
import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;
import at.oerp.util.StringUtil;

public class Printer58mm extends PosHwPrinter implements CtrlBytes, LinePrintDriver  {

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
	
	// send led
	protected final static byte[] ESC_Q_A  = new byte[] { ESC, 'Q', 'A' };
	
	// sleep
	protected final int  SWITCH_SLEEP = 50;
	
	// VARS
	
	private File	   dev;
	private SerialPort port;
	private SerialPortAdapter displayPort;
	
	private OutputStream output;
	private Charset unicode;
	private Charset ascii;
	private T508AQService service;
	
	
	/**
	 * constructor
	 * @throws SecurityException
	 * @throws IOException
	 */
	public Printer58mm(T508AQService inService) throws SecurityException, IOException {
		service = inService;
		unicode = Charset.forName("unicode");
		ascii = Charset.forName("ascii");
		dev =  new File("/dev/ttyS3");
		displayPort = new SerialPortAdapter(dev, 0);
	}
	
	/**
	 * @param inMs
	 * @return true if not interrupted
	 */
	protected boolean sleep(int inMs) {
		try {
			Thread.sleep(inMs);
			return true;
		} catch (InterruptedException e1) {
			Thread.currentThread().interrupt();
			return false;
		}
	}
	
	/**
	 * switch to printer
	 * @throws IOException
	 */
	protected boolean switchToPrinter() throws IOException {
		if ( displayPort.isOpen() ) {
			// double check disable
			if ( GpioControl.LED_CTL(false) != 0 ) {
				sleep(SWITCH_SLEEP);
				GpioControl.LED_CTL(false);
			}
			
			// clear input
			displayPort.clearInput();
			
			// sleep after close
			if ( displayPort.isOpen() ) {
				displayPort.close();
				sleep(SWITCH_SLEEP);
			}		
		}
		
		// enable printer
		if ( Ioctl.convertPrinter() == 0 ) {
			// open again
			if ( port == null ) {			
				port = new SerialPort(dev, 115200, 0, 2);
				output = port.getOutputStream();
			}
			return true;
		}
		return false;
	}
	
	
	/**
	 * switch to led
	 * @throws IOException
	 */
	protected boolean switchToLed() throws IOException  {
		if ( port != null ) {
			port.close();
			port = null;
			output = null;
		}
		
		// sleep after close
		sleep(SWITCH_SLEEP);
		
		// enable
		Ioctl.convertLed();
		boolean enabled =  GpioControl.LED_CTL(true) == 0;
		if ( !enabled ) {
			enabled =  GpioControl.LED_CTL(true) == 0;
		}
		
		// if enabled open
		if ( enabled ) {
			displayPort.open(9600);
			sleep(SWITCH_SLEEP);
			return true;
		}
		
		return false;
	}
	
	@Override
	public String getType() {
		return "58mm";
	}
	
	@Override
	public void printHtml(String inHtml, IObjectResolver inResolver) throws IOException {
		synchronized ( service ) {
			if ( switchToPrinter() ) {
				inHtml = StringUtil.toAscii(inHtml);
				HtmlLinePrinter printer = new HtmlLinePrinter(this, inResolver);
				printer.print(inHtml);
				print(LF);
				print(LF);
				print(LF);
				print(LF);
				print(LF);
			}
		}
	}
	

	@Override
	public void printTest() throws IOException {
		synchronized ( service ) {
			if ( switchToPrinter() ) {
				print(ESC_ENTER);
				print(ESC_ENTER);
				print(ESC_FONT_SMALL);
				write("Fetter Text!");
				write(" Und jetzt wieder normal");
				print(ESC_ENTER);
				print(ESC_ENTER);
			}
		}
	}
	
	/**
	 * TODO The unicode printing not WORK!!!
	 * @param data
	 * @throws IOException
	 */ 
	protected void writeUnicode(String data) throws IOException {
		if ( data == null )
			data = "";
		
		byte[] bData = data.getBytes(unicode);
		byte[] buf = new byte[2];
		
		for ( int i=buf.length; i < bData.length; i+=buf.length ) {
			buf[0] = bData[i+1];
			buf[1] = bData[i];
			output.write(buf);
		}
		
		output.flush();		
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
	
	public synchronized boolean setDisplay(LedDisplayImpl inDisplay, String... inLines) throws IOException  {
		try {
			if ( switchToLed() ) {
				String line = inDisplay.getFirstLine(inLines);
				displayPort.write(ESC_Q_A);
				displayPort.write(line);
				displayPort.write(CR);
				displayPort.flush();
				return true;
			}
		} finally {
			switchToPrinter();
		}	
		return false;
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
	
	// LINE PRINTER
	
	@Override
	public void reset() throws IOException {
		print(ESC_ALIGN_LEFT);	
		/*
		print(ESC_FONT_COLOR_DEFAULT);
		print(FS_FONT_ALIGN);
		print(ESC_ALIGN_LEFT);
		print(ESC_CANCEL_BOLD);
		print(LF);*/		
	}


	@Override
	public double getWidth_mm() throws IOException {
		return 48.0;
	}

	@Override
	public double getCharWidth_mm(int inFont, int inStyle) {
		return 1.5;
	}

	@Override
	public void setFont(int inFont) throws IOException {		
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
	}
	
	public void write(String inText) throws IOException {
		output.write(inText.getBytes(ascii));
		output.flush();
	}

	@Override
	public void writeln(String inText) throws IOException {		
		//write(inText);
		writeUnicode(inText);
		print(LF);
	}
	
}
