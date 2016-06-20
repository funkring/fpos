package at.oerp.pos.hw.cm550;

import java.io.IOException;

import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;
import at.oerp.util.StringUtil;
import hardware.print.printer;

public class Printer58mm extends PosHwPrinter implements CtrlBytes, LinePrintDriver {

	// service
	private CM550Service service;

	// printer 
	private printer driver;

	/**
	 * constructor
	 * @throws SecurityException
	 * @throws IOException
	 */
	public Printer58mm(CM550Service inService) throws SecurityException, IOException {
		service = inService;
			
		// init
		driver = new printer();
		printer.Open();
	}
	
	@Override
	public String getType() {
		return "58mm";
	}
	
	@Override
	public void printHtml(String inHtml, IObjectResolver inResolver) throws IOException {
		synchronized ( this ) {			
			inHtml = StringUtil.toAscii(inHtml);
			HtmlLinePrinter printer = new HtmlLinePrinter(this, inResolver);
			printer.print(inHtml);
			writeln("");
			writeln("");
			writeln("");
			writeln("");
			writeln("");
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
		printer.Close();
	}
	
	// LINE PRINTER
	
	@Override
	public void reset() throws IOException {
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
			return 47.0/30.0;
		}
	}

	@Override
	public void setFont(int inFont) throws IOException {
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
	}
	
	@Override
	public void writeln(String inText) throws IOException {
		if ( inText == null || inText.isEmpty() ) {
			inText = "";
		}
		driver.PrintString24(inText + "\r\n");
	}
}
