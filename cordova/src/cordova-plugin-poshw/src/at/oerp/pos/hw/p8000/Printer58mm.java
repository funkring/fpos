package at.oerp.pos.hw.p8000;

import java.io.IOException;

import com.bw.spdev.PosDevCallBackController;
import com.bw.spdev.Printer;

import android.app.Application;
import android.util.Log;
import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;
import at.oerp.util.StringUtil;

public class Printer58mm extends PosHwPrinter implements CtrlBytes, LinePrintDriver {

	private final static String TAG = "P8000.Printer";
	
	// service
	private P8000Service service;

	// printer 
	private Printer driver;
	private PrinterCtrl ctrl;
	private StringBuilder data;

	// state
	private boolean 	  validStatus;
	private int			  status;
	
	
	/**
	 * constructor
	 * @throws SecurityException
	 * @throws IOException
	 */
	public Printer58mm(P8000Service inService) throws SecurityException, IOException {
		service = inService;
		data = new StringBuilder();
		ctrl = new PrinterCtrl();
			
		// get context		
		Application app = service.getApplication();

		// init
		driver = Printer.getInstance();
		driver.Init(ctrl, app.getApplicationContext());
		driver.ClearPrintData();
		
		// config
		driver.SetStep(1000);
		driver.SetPrinterPara((short) 1250);
		driver.SetFontSize(18);
	}
	
	@Override
	public String getType() {
		return "58mm";
	}
	
	@Override
	public void printHtml(String inHtml, IObjectResolver inResolver) throws IOException {
		synchronized ( this ) {			
			data.setLength(0);
			
			inHtml = StringUtil.toAscii(inHtml);
			HtmlLinePrinter printer = new HtmlLinePrinter(this, inResolver);
			printer.print(inHtml);
			writeln("");
			writeln("");
			writeln("");
			writeln("");
			writeln("");
			
			if ( data.length() > 0 ) {
				try {
					validStatus = false; 
					driver.PrintString(data.toString());
					for ( int i=0; i<600 && !validStatus; i++) {
						wait(1000);
					}					
					wait(1000);
				} catch ( InterruptedException e ) {
					Thread.currentThread().interrupt();
				} catch ( Exception e ) {
					Log.e(TAG, e.getMessage());
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
		driver.ClearPrintData();		
		// set font
		/*
		File font = new File("/system/fonts/Hack-Regular.ttf");
		if ( font.exists() ) {
			driver.SetFont(font.getName(), 22);
		} else {
			driver.SetFontSize(22);
		}*/
		
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
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
	}
	
	@Override
	public void writeln(String inText) throws IOException {
		if ( inText == null )
			inText = "";
		data.append(inText);
		data.append("\r\n");
	}
	
	
	class PrinterCtrl extends PosDevCallBackController {
		@Override
		public int onPrinterPrint(int inStatus) {
			synchronized (Printer58mm.this) {
				Printer58mm.this.validStatus = true;
				Printer58mm.this.status = inStatus;		
				Printer58mm.this.notify();
			}
			return super.onPrinterPrint(inStatus);
		}
	}
	
}
