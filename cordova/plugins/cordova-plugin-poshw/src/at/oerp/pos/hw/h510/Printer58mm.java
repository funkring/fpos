package at.oerp.pos.hw.h510;

import java.io.IOException;
import java.nio.charset.Charset;

import com.cloudpos.apidemo.jniinterface.PrinterInterface;

import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;
import at.oerp.util.StringUtil;

public class Printer58mm extends PosHwPrinter implements CtrlBytes, LinePrintDriver  {

	// cmds
	private final static byte[] CMD_FONT_NORMAL = new byte[]{ 0x1B, 0x21, 0x00};
	private final static byte[] CMD_FONT_SMALL = new byte[]{ 0x1B, 0x21, 0x01};
	private final static byte[] CMD_FONT_LARGE = new byte[]{ 0x1B, 0x21, 0x38};
	private final static byte[] CMD_STYLE_BOLD = new byte[] { 0x1B,  0x45, 0x1 };
	private final static byte[] CMD_STYLE_NONE = new byte[] { 0x1B,  0x45, 0x0 };
	
	//private Charset unicode;
	private Charset ascii;
	// service
	private H510PosService service;
	
	
	/**
	 * constructor
	 * @throws SecurityException
	 * @throws IOException
	 */
	public Printer58mm(H510PosService inService) throws SecurityException, IOException {
		service = inService;
		//unicode = Charset.forName("unicode");
		ascii = Charset.forName("ascii");
	}
	
	@Override
	public String getType() {
		return "58mm";
	}
	
	@Override
	public void printHtml(String inHtml, IObjectResolver inResolver) throws IOException {
		synchronized ( service ) {
			try {
				PrinterInterface.PrinterOpen();
				PrinterInterface.PrinterBegin();
				inHtml = StringUtil.toAscii(inHtml);
				HtmlLinePrinter printer = new HtmlLinePrinter(this, inResolver);
				printer.print(inHtml);
				PrinterInterface.PrinterWrite(LF_CMD, LF_CMD.length);
				PrinterInterface.PrinterWrite(LF_CMD, LF_CMD.length);
				PrinterInterface.PrinterWrite(LF_CMD, LF_CMD.length);
			} finally {
				PrinterInterface.PrinterEnd();
				PrinterInterface.PrinterClose();
			}
		}
	}
	

	@Override
	public void printTest() throws IOException {
		synchronized ( service ) {
			try {
				PrinterInterface.PrinterOpen();
				PrinterInterface.PrinterBegin();
				writeln("Der Druckertest");				
				
			} finally {
				PrinterInterface.PrinterEnd();
				PrinterInterface.PrinterClose();
			}
		}
	}
	

	@Override
	public synchronized void close() {
	}
	
	// LINE PRINTER
	
	@Override
	public void reset() throws IOException {	
		setFont(FONT_DEFAULT);
		setStyle(STYLE_NONE);
	}

	@Override
	public double getWidth_mm() throws IOException {
		return 48.0;
	}

	@Override
	public double getCharWidth_mm(int inFont, int inStyle) {	
		switch (inFont ) {
			case FONT_LARGE:
				return 48.0/16.0;
			case FONT_SMALL:
				return 48.0/32.0;
			default:
				return 48.0/32.0;
		}
	}

	@Override
	public void setFont(int inFont) throws IOException {
		switch (inFont ) {
		case FONT_LARGE:
			PrinterInterface.PrinterWrite(CMD_FONT_LARGE, CMD_FONT_LARGE.length);
			break;
		case FONT_SMALL:
			PrinterInterface.PrinterWrite(CMD_FONT_SMALL, CMD_FONT_SMALL.length);
			break;
		default:
			PrinterInterface.PrinterWrite(CMD_FONT_NORMAL, CMD_FONT_NORMAL.length);
			break;
	}
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
		if ( inStyle == STYLE_NONE ) {
			PrinterInterface.PrinterWrite(CMD_STYLE_NONE, CMD_STYLE_NONE.length);
		} else if ( (inStyle & STYLE_BOLD)  >  0 ) {
			PrinterInterface.PrinterWrite(CMD_STYLE_BOLD, CMD_STYLE_BOLD.length);
		}
	}
	
	public void write(String inText) throws IOException {
		byte[] b = inText.getBytes(ascii);
		PrinterInterface.PrinterWrite(b, b.length);
	}

	@Override
	public void writeln(String inText) throws IOException {
		if ( inText != null && inText.length() > 0)
			write(inText);
		PrinterInterface.PrinterWrite(LF_CMD, LF_CMD.length);
	}
	
}
