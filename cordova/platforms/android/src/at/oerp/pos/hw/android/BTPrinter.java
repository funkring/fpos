package at.oerp.pos.hw.android;

import java.io.IOException;
import java.io.InputStream;
import java.io.InterruptedIOException;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.util.Set;
import java.util.UUID;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.graphics.Bitmap;
import android.util.Log;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwService;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;
import at.oerp.util.PrinterImage;
import at.oerp.util.StringUtil;

public class BTPrinter extends PosHwPrinter implements LinePrintDriver {

	protected PosHwService service;	
	protected BluetoothDevice  dev;
	
	// socket
	protected BluetoothSocket socket;
	protected InputStream	in;
	protected OutputStream  out;

	protected Charset ascii;

	protected byte[] cmd3 = new byte[3];
	protected byte[] cmd4 = new byte[4];
	protected byte[] cmd2 = new byte[2];

	protected double  width_mm = 48.0;
	protected double  charWidth_mm = 1.5;
	protected double  smallCharWidth = 1.0/12.0*9;
	protected double  smallCharHeight = 1.0/24.0*17.0;
	protected int	  timeout = 2000;
	protected int	  sleep = 0;

	protected int 	printerStatus = 0;
	protected int	offlineStatus = 0;
	protected int 	errorStatus = 0;
	protected int   paperStatus = 0;
	protected int	defaultStyle = STYLE_NONE;
	protected int 	defaultFont = FONT_DEFAULT;

	// printer status
	private final static int STPRN_DRAWER_OPEN = 1 << 2;

	// offline status
	private final static int STOFF_PLATEN_OPEN = 1 << 2;
	private final static int STOFF_PAPERFEED   = 1 << 3;
	private final static int STOFF_ERROR 		 = 1 << 6;

	// error status
	private final static int STERR_AUTOCUTTER = 1 << 3;
	private final static int STERR_UNRECOVERABLE = 1 << 5;
	private final static int STERR_AUTORECOVERABLE = 1 << 6;

	// paper status
	private final static int STPAP_ROLLEND = 1 << 6;

	// select
	private final static int SEL_FONT_A = 0;
	private final static int SEL_FONT_B = 1;
	private final static int SEL_FONT_EMP = 1 << 3;
	private final static int SEL_FONT_DOUBLE_H = 1 << 4;
	private final static int SEL_FONT_DOUBLE_W = 1 << 5;
	private final static int SEL_FONT_UNDERLINE = 1 << 7;

	// debug tag
	private final static String TAG = "BTPrinter"; 
	// bluetooth default serial uuid
	private final static UUID BT_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
	
	
	public static BTPrinter create(PosHwService inService) {
		BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
		adapter.cancelDiscovery();
		BTPrinter foundPrinter = null;
		if ( adapter.isEnabled() ) {
			Set<BluetoothDevice> devices = adapter.getBondedDevices();
			for ( BluetoothDevice dev : devices ) {
				try {
					BTPrinter printer = null;
					if ( dev.getName().equalsIgnoreCase("RPP200-E") ) {
						printer = new BTPrinter().setup(inService, dev);
					} else if (  dev.getName().equalsIgnoreCase("RPP300-E") ) {
						printer = new BTPrinter80().setup(inService, dev);
					}  else if (  dev.getName().equalsIgnoreCase("Bluetooth Printer") ) {
						printer = new BTPrinter().setup(inService, dev);
					}
					
					// check if printer was found
					if ( printer != null ) {
						foundPrinter = printer;
						
						// try open printer
						foundPrinter.open();
						return foundPrinter;
					}
					
				} catch (IOException e) {
					Log.e(TAG, "Unable to init " + dev.getName());
				}
			}
			
		}	
		return foundPrinter;
	}
	
	public UUID getUUID() {
		return BT_UUID;
	}
	
	public BTPrinter() {
		ascii = Charset.forName("ascii");
	}
	
	protected synchronized BTPrinter setup(PosHwService inService, BluetoothDevice inDev) throws IOException {
		service = inService;
		dev = inDev;
		return this;
	}
	
	protected synchronized void open() throws IOException {
		// close before open new
		close();
		
		socket = dev.createInsecureRfcommSocketToServiceRecord(getUUID());
		try {
			socket.connect();			
			in = socket.getInputStream();
			out = socket.getOutputStream();
		} catch ( IOException e ) {
			// close on error
			close();
			throw e;
		}
	}

	@Override
	public synchronized void close() {
		if ( out != null ) {
			try {
				out.flush();
				out.close();
			} catch (IOException e ) {
				Log.e(TAG, e.getMessage(), e);
			} finally {
				out = null;
			}
		}
		if ( in != null ) {
			try {
				in.close();
			} catch (IOException e ) {
				Log.e(TAG, e.getMessage(),e);
			} finally {
				in = null;
			}
		}
		if ( socket != null ) {
			try {
				socket.close();
			} catch (IOException e) {
				Log.e(TAG, e.getMessage(),e);
			} finally {
				socket = null;
			}
		}		
	}


	
	public boolean hasError() {
		return    (offlineStatus & (STOFF_PLATEN_OPEN | STOFF_ERROR)) > 0
			   || (errorStatus & (STERR_AUTOCUTTER | STERR_UNRECOVERABLE)) > 0
			   || (paperStatus & STPAP_ROLLEND) > 0;
	}

	public boolean isCashboxOpen() {
		return (printerStatus & STPRN_DRAWER_OPEN) > 0;
	}

	public boolean isPlatenOpen() {
		return (offlineStatus & STOFF_PLATEN_OPEN) > 0;
	}

	public boolean isNoPaperfeed() {
		return (offlineStatus & STOFF_PAPERFEED) > 0;
	}

	public boolean isErrorOccurred() {
		return (offlineStatus & STOFF_ERROR) > 0;
	}

	public boolean isAutoCutterError() {
		return (errorStatus & STERR_AUTOCUTTER ) > 0;
	}

	public boolean isUnrecoverableError() {
		return (errorStatus & STERR_UNRECOVERABLE ) > 0;
	}

	public boolean isRecoverableError() {
		return (errorStatus & STERR_AUTORECOVERABLE ) > 0;
	}

	public boolean noPaper() {
		return (paperStatus & STPAP_ROLLEND ) > 0;
	}

	public String toString() {
		StringBuilder b = new StringBuilder(String.format("PRINTER\t%s [width=%s,charwidth=%s,timeout=%s]", dev.getName(), width_mm, charWidth_mm, timeout));
		b.append(String.format("\n\terror              = %s", hasError()));
		b.append(String.format("\n\tdrawerOpen         = %s", isCashboxOpen()));
		b.append(String.format("\n\tplatenOpen         = %s", isPlatenOpen()));
		b.append(String.format("\n\tnoPaperFeed        = %s", isNoPaperfeed()));
		b.append(String.format("\n\terrorOccurred      = %s", isErrorOccurred()));
		b.append(String.format("\n\tautoCutterError    = %s", isAutoCutterError()));
		b.append(String.format("\n\tunrecoverableError = %s", isUnrecoverableError()));
		b.append(String.format("\n\trecoverableError   = %s", isRecoverableError()));
		b.append(String.format("\n\tnoPaper            = %s", noPaper()));
		return b.toString();
	}

	public boolean isOpen() {
		return socket != null;
	}
	
	public synchronized void printHtml(String inHtml) throws IOException {
		try {
			// open
			if ( !isOpen() ) open();

			// print
			HtmlLinePrinter p = new HtmlLinePrinter(this);
			inHtml = StringUtil.toAscii(inHtml);
			p.print(inHtml);
			feed(7);
			cut();
			
			out.flush();
			
			// sleep mode
			if ( sleep > 0 ) {
				sleepAfter(sleep);
			}
			
		} catch ( IOException e) {
			close();
			throw e;
		} 
	}

	@Override
	public void writeln(String inText) throws IOException {
		out.write(inText.getBytes(ascii));
		out.write(0xA);
	}

	public void cut() throws IOException {
	}

	public void feed(int inLines) throws IOException {
		cmd3[0] = 0x1B;
		cmd3[1] = (byte) 'd';
		cmd3[2] = (byte) inLines;
		out.write(cmd3);
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
		int hwStyle = 0;
		if (( inStyle & STYLE_SMALL) > 0) {
			hwStyle |= SEL_FONT_B;
		}
		if (( inStyle & STYLE_BOLD) > 0) {
			hwStyle |= SEL_FONT_EMP;
		}
		if (( inStyle & STYLE_DOUBLE_H) > 0) {
			hwStyle |= SEL_FONT_DOUBLE_H;
		}
		if (( inStyle & STYLE_DOUBLE_W) > 0) {
			hwStyle |= SEL_FONT_DOUBLE_W;
		}
		if (( inStyle & STYLE_UNDERLINE) > 0) {
			hwStyle |= SEL_FONT_UNDERLINE;
		}
		selectFont(hwStyle);
	}

	public void setCodeTable(byte inTable) throws IOException {
		cmd3[0] = 0x1B;
		cmd3[1] = (byte) 't';
		cmd3[2] = inTable;
		out.write(cmd3);
	}

	public void init() throws IOException {
		cmd2[0] = 0x1B;
		cmd2[1] = (byte) '@';
		out.write(cmd2);
	}

	public void readStatus() throws IOException {
		cmd3[0] = 0x10;
		cmd3[1] = 0x04;

		// printer status
		cmd3[2] = 1;
		out.write(cmd3);
		printerStatus = in.read();

		// offline status
		cmd3[2] = 2;
		out.write(cmd3);
		offlineStatus = in.read();

		// error status
		cmd3[2] = 3;
		out.write(cmd3);
		errorStatus = in.read();

		// paper status
		cmd3[2] = 4;
		out.write(cmd3);
		paperStatus = in.read();
	}

	@Override
	public void reset() throws IOException {

		// if sleep wakeup
		if ( sleep > 0 ) {
			wakeUp();
		}
		
		init();		
		setStyle(defaultStyle);
	}

	/**
	 * wake up
	 * @throws IOException
	 */
	protected void wakeUp() throws IOException {
		out.write(0xFF);
		out.flush();
		try {
			Thread.sleep(50);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new InterruptedIOException();
		}		
	}
	
	/**
	 * sleep 
	 * @param inSeconds
	 * @throws IOException
	 */
	protected void sleepAfter(int inSeconds) throws IOException {
		cmd4[0] = 0x1B;
		cmd4[1] = 0x38;		
		cmd4[2] = (byte) (inSeconds & 0xFF);
		cmd4[3] = (byte) (inSeconds >> 8);
		out.write(cmd4);
	}

	@Override
	public void setFont(int inFont) throws IOException {
	}

	public void selectFont(int inSel) throws IOException {
		cmd3[0] = 0x1B;
		cmd3[1] = (byte) '!';
		cmd3[2] = (byte) inSel;
		out.write(cmd3);
	}

	@Override
	public double getWidth_mm() throws IOException {
		return width_mm;
	}


	@Override
	public double getCharWidth_mm(int inFont, int inStyle) {
		double charWidth = charWidth_mm;
		if ( (inStyle & STYLE_SMALL ) > 0  ) {
			charWidth = (charWidth*smallCharWidth);
		}
		if ( (inStyle & STYLE_DOUBLE_W ) > 0 ) {
			charWidth*=2;
		}
		return charWidth;
	}

	public double getDefaultCharWidth_mm() {
		return getCharWidth_mm(defaultFont, defaultStyle);
	}

	public void setDefaultCharWidth_mm(double inCharWidth_mm) {
		charWidth_mm = inCharWidth_mm;
	}

	public void setDefaultWidth_mm(double inWidth_mm) {
		width_mm = inWidth_mm;
	}

	public double getSmallCharWidth() {
		return smallCharWidth;
	}

	public void setSmallCharWidth(double smallCharWidth) {
		this.smallCharWidth = smallCharWidth;
	}

	public double getSmallCharHeight() {
		return smallCharHeight;
	}

	public void setSmallCharHeight(double smallCharHeight) {
		this.smallCharHeight = smallCharHeight;
	}

	public int getDefaultStyle() {
		return defaultStyle;
	}

	public void setDefaultStyle(int defaultStyle) {
		this.defaultStyle = defaultStyle;
	}

	public int getDefaultFont() {
		return defaultFont;
	}

	public void setDefaultFont(int defaultFont) {
		this.defaultFont = defaultFont;
	}

	public int getTimeout() {
		return timeout;
	}


	public void setTimeout(int timeout) {
		this.timeout = timeout;
	}

	public String getType() {
		return "57mm";
	}

	@Override
	public void printTest() throws IOException {
		
	}

	@Override
	public void printImage(PrinterImage inImage) throws IOException {
		
	}

	@Override
	public double getPixel_mm() {
		return 1.0;
	}

}
