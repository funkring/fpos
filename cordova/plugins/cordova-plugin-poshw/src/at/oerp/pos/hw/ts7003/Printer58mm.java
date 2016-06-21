package at.oerp.pos.hw.ts7003;

import java.io.IOException;

//import android.pt.printer.Printer;
import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;
import at.oerp.util.StringUtil;

public class Printer58mm extends PosHwPrinter implements CtrlBytes, LinePrintDriver  {

	// service
	private TS7003PosService service;
	// printer api
	//private Printer driver;
	
	/**
	 * constructor
	 * @throws SecurityException
	 * @throws IOException
	 */
	public Printer58mm(TS7003PosService inService) throws SecurityException, IOException {
		service = inService;		
		//driver = new Printer();		
	}
	
	@Override
	public String getType() {
		return "58mm";
	}
	
	@Override
	public void printHtml(String inHtml, IObjectResolver inResolver) throws IOException {
		synchronized ( service ) {
//			if ( driver.open() == 0 ) {
//				try {
//					inHtml = StringUtil.toAscii(inHtml);
//					HtmlLinePrinter printer = new HtmlLinePrinter(this, inResolver);
//					printer.print(inHtml);
//					writeln("");
//					writeln("");
//					writeln("");
//					writeln("");
//					writeln("");
//				} finally {
//					driver.close();
//				}
//			} 
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
//		switch (inFont ) {
//		case FONT_LARGE:
//			driver.setFontHeightZoomIn(2);
//			driver.setFontwidthZoomIn(2);
//			break;
//		default:
//			driver.setFontHeightZoomIn(1);
//			driver.setFontwidthZoomIn(1);
//			break;
//	}
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
//		if ( inStyle == STYLE_NONE ) {
//			driver.setBold(false);
//		} else if ( (inStyle & STYLE_BOLD)  >  0 ) {
//			driver.setBold(true);
//		}
	}
	
	@Override
	public void writeln(String inText) throws IOException {
//		if ( inText != null && inText.length() > 0 ) {			
//			driver.printString(inText);
//		} else {
//			driver.printString(" ");
//		}
	}
	
}
