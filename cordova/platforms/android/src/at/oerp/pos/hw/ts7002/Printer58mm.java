package at.oerp.pos.hw.ts7002;

import java.io.IOException;

import android.pt.Cprinter7002;
import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;
import at.oerp.util.StringUtil;

public class Printer58mm extends PosHwPrinter implements CtrlBytes, LinePrintDriver  {

	// service
	private TS7002PosService service;
	// printer api
	private Cprinter7002 driver;
	
	/**
	 * constructor
	 * @throws SecurityException
	 * @throws IOException
	 */
	public Printer58mm(TS7002PosService inService) throws SecurityException, IOException {
		service = inService;		
		driver = new Cprinter7002();		
	}
	
	@Override
	public String getType() {
		return "58mm";
	}
	
	@Override
	public void printHtml(String inHtml, IObjectResolver inResolver) throws IOException {
		synchronized ( service ) {
			if ( driver.openPrinter() == 0 ) {
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
					driver.closePrinter();
				}
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
				return 48.0/42.0;
			default:
				return 48.0/32.0;
		}
	}

	@Override
	public void setFont(int inFont) throws IOException {
		switch (inFont ) {
		case FONT_LARGE:
			driver.setZoonIn(2,2);
			break;
		default:
			driver.setZoonIn(1,1);
			break;
	}
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
		if ( inStyle == STYLE_NONE ) {
			driver.setBold(0);
		} else if ( (inStyle & STYLE_BOLD)  >  0 ) {
			driver.setBold(1);
		}
	}
	
	@Override
	public void writeln(String inText) throws IOException {
		if ( inText != null ) {
			driver.printString(inText);
		} else {
			driver.printString("");
		}
	}
	
}
