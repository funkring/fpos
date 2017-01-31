package at.oerp.pos.hw.cpos800;

import java.io.IOException;

import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;
import at.oerp.util.StringUtil;

public class Printer58mm extends PosHwPrinter implements CtrlBytes, LinePrintDriver  {

	// service
	private CPOS800Service service;
	// printer api
	private PrinterAPI driver;
	
	/**
	 * constructor
	 * @throws SecurityException
	 * @throws IOException
	 */
	public Printer58mm(CPOS800Service inService) throws SecurityException, IOException {
		service = inService;		
		driver = new PrinterAPI();		
		driver.openPrint();
	}
	
	@Override
	public String getType() {
		return "58mm";
	}
	
	@Override
	public void printHtml(String inHtml, IObjectResolver inResolver) throws IOException {
		synchronized ( service ) {
			try {
				inHtml = StringUtil.toAscii(inHtml);
				HtmlLinePrinter printer = new HtmlLinePrinter(this, inResolver);
				printer.print(inHtml);
				writeln("");
				writeln("");
				writeln("");
				writeln("");
				writeln("");
			} finally {
				
			}
		}
	}
	

	@Override
	public void printTest() throws IOException {
		synchronized ( service ) {
			writeln("Der Druckertest");				
		}
	}
	

	@Override
	public synchronized void close() {
		driver.closePrint();
	}
	
	// LINE PRINTER
	
	@Override
	public void reset() throws IOException {
		driver.initPrint();
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
				return 48.0/42.0;
			default:
				return 48.0/32.0;
		}
	}

	@Override
	public void setFont(int inFont) throws IOException {
		switch (inFont ) {
		case FONT_LARGE:
			//TODO Implement
			break;
		default:
			//TODO Implement
			break;
	}
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
		if ( inStyle == STYLE_NONE ) {
			//driver.setDouble(false);
		} else if ( (inStyle & STYLE_BOLD)  >  0 ) {
			//driver.setDouble(true);
		}
	}
	
	@Override
	public void writeln(String inText) throws IOException {
		if ( inText != null ) {
			driver.printLine(inText);
		} else {
			driver.doPrintPaper();
		}
	}
	
}
