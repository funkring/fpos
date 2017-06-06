package at.oerp.pos.hw.android;

import java.io.IOException;
import java.io.InterruptedIOException;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;

import android.graphics.Bitmap;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwService;
import at.oerp.util.BinUtil;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.PrinterImage;
import at.oerp.util.StringUtil;

public abstract class BasicPrinter extends PosHwPrinter {

	
	protected byte[] cmd3 = new byte[3];
	protected byte[] cmd4 = new byte[4];
	protected byte[] cmd2 = new byte[2];
	protected ByteBuffer imgBuffer;
	
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

	// iface
	protected final PrinterInterface iface;
	// service
	protected final PosHwService service;
	// charset
	protected final Charset ascii;
	
	/**
	 * constructor
	 */
	public BasicPrinter(PosHwService inService, PrinterInterface inIface) {
		ascii = Charset.forName("ascii");
		iface = inIface;
		service = inService;
		sleep = inIface.getDefaultSleep();
	}

	/**
	 * open printer
	 * @throws IOException
	 */
	public void open() throws IOException {
		iface.open();	
	}	
	
	/**
	 * close printer
	 */
	public void close() {
		iface.close();		
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
		StringBuilder b = new StringBuilder(String.format("PRINTER\t%s [width=%s,charwidth=%s,timeout=%s]", iface.getName(), width_mm, charWidth_mm, timeout));
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
	
	public void printHtml(String inHtml) throws IOException {
		synchronized ( service ) {
			try {
				// open
				if ( !iface.isOpen() ) iface.open();
				iface.begin();
	
				// print
				HtmlLinePrinter p = new HtmlLinePrinter(this);
				inHtml = StringUtil.toAscii(inHtml);
				p.print(inHtml);
				
				// feed and cut
				feed(5);
				cut();
				
				// sleep mode
				if ( sleep > 0 ) {
					sleepAfter(sleep);
				}
				
				iface.end();			
			} catch ( IOException e) {
				iface.close();
				throw e;
			} 
		}
	}

	@Override
	public void writeln(String inText) throws IOException {
		iface.write(inText.getBytes(ascii));
		iface.write(0xA);
	}

	public void cut() throws IOException {
	}

	public void feed(int inLines) throws IOException {
		cmd3[0] = 0x1B;
		cmd3[1] = (byte) 'd';
		cmd3[2] = (byte) inLines;
		iface.write(cmd3);
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
		iface.write(cmd3);
	}

	public void init() throws IOException {
		cmd2[0] = 0x1B;
		cmd2[1] = (byte) '@';
		iface.write(cmd2);
	}

	public void readStatus() throws IOException {
		if ( !iface.readSupport() ) return;
		
		cmd3[0] = 0x10;
		cmd3[1] = 0x04;

		// printer status
		cmd3[2] = 1;
		iface.write(cmd3);
		printerStatus = iface.read();

		// offline status
		cmd3[2] = 2;
		iface.write(cmd3);
		offlineStatus = iface.read();

		// error status
		cmd3[2] = 3;
		iface.write(cmd3);
		errorStatus = iface.read();

		// paper status
		cmd3[2] = 4;
		iface.write(cmd3);
		paperStatus = iface.read();
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
		iface.write(0xFF);
		iface.flush();
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
		iface.write(cmd4);
	}

	@Override
	public void setFont(int inFont) throws IOException {
	}

	public void selectFont(int inSel) throws IOException {
		cmd3[0] = 0x1B;
		cmd3[1] = (byte) '!';
		cmd3[2] = (byte) inSel;
		iface.write(cmd3);
	}
	
	public void alignCenter() throws IOException {
		cmd3[0] = 0x1B;
		cmd3[1] = (byte) 'a';
		cmd3[2] = 0x01;
		iface.write(cmd3);
	}
	
	public void alignLeft() throws IOException {
		cmd3[0] = 0x1B;
		cmd3[1] = (byte) 'a';
		cmd3[2] = 0x00;
		iface.write(cmd3);
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
	public double getPixel_mm() {
		return 8.0;
	}
	
	
	protected ByteBuffer convertImage(PrinterImage inImage, ByteBuffer inBuf) throws IOException {
		int bmpWidth = inImage.getWidth();
		int bmpHeight = inImage.getHeight();
		int stride = bmpWidth % 8 == 0 ? bmpWidth / 8 : (bmpWidth / 8) + 1;

		// image command
		cmd4[0] = 0x1D;
		cmd4[1] = 0x76;
		cmd4[2] = 0x30;
		cmd4[3] = 0x00;
		
		int size = cmd4.length+2+2+(stride*bmpHeight);
		
		// init buffer
		if ( inBuf == null || inBuf.capacity() < size) {
			inBuf = ByteBuffer.allocate(size);
		} else {			
			inBuf.rewind();			
		}
		inBuf.limit(size);
		
		//build command		
		inBuf.put(cmd4);
		inBuf.put(BinUtil.getWordLow(stride));
		inBuf.put(BinUtil.getWordHigh(stride));
		inBuf.put(BinUtil.getWordLow(bmpHeight));
		inBuf.put(BinUtil.getWordHigh(bmpHeight));
		
		// build buffer		
		byte[] buf = inBuf.array();
		for (int y = 0; y < bmpHeight; y++) {
			for (int x = 0; x < bmpWidth; x++) {
				BinUtil.setBitReverse(buf, inBuf.position(), x, inImage.isBlack(x, y));				
			}			
			inBuf.position(inBuf.position()+stride);
		}

		inBuf.flip();
		return inBuf;		
	}

	@Override
	public PrinterImage prepareImage(PrinterImage inImage) throws IOException {
		if ( inImage.getClass() != PreparedImage.class ) {
			ByteBuffer imageData = convertImage(inImage, null);
			return new PreparedImage(inImage, imageData);
		}
		return super.prepareImage(inImage);
	}
	
	protected void beforeImage(PrinterImage inImage) throws IOException {
		alignCenter();
	}
	
	protected void afterImage(PrinterImage inImage) throws IOException {
		alignLeft();
	}
	
	@Override
	public void printImage(PrinterImage inImage) throws IOException {
		ByteBuffer data;
		if ( inImage.getClass() == PreparedImage.class ) {
			data = ((PreparedImage) inImage).getData();
		} else {			
			data = imgBuffer = convertImage(inImage, imgBuffer);
		}

		// print image
		beforeImage(inImage);
		iface.flush();
		iface.write(data.array(), 0, data.limit());
		iface.flush();
		afterImage(inImage);
	}
	
	/**
	 * Prepared Image, for fast processing
	 * @author oerp
	 */
	public final static class PreparedImage implements PrinterImage {
		final ByteBuffer   data;
		final PrinterImage image;
		
		public PreparedImage(PrinterImage inImage, ByteBuffer inData) {
			image = inImage;
			data = inData;
		}
		
		@Override
		public int getWidth() {
			return image.getWidth();
		}

		@Override
		public int getHeight() {
			return image.getHeight();
		}

		@Override
		public boolean isBlack(int x, int y) {
			return image.isBlack(x, y);
		}
		
		public ByteBuffer getData() {
			return data;
		}

		@Override
		public Bitmap getBitmap() {
			return image.getBitmap();
		}		
	}

}
