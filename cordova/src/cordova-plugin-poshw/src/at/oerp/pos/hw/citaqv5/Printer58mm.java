package at.oerp.pos.hw.citaqv5;

import java.io.IOException;
import java.util.LinkedList;

import android.app.Application;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.os.RemoteException;
import android.util.Log;
import woyou.aidlservice.jiuiv5.*;

import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.util.HtmlLinePrinter;
import at.oerp.util.IObjectResolver;
import at.oerp.util.LinePrintDriver;
import at.oerp.util.StringUtil;

public class Printer58mm extends PosHwPrinter implements CtrlBytes, LinePrintDriver {

	private final static String TAG = "Printer58mm";
	
	// service
	private CITAQV5Service service;

	// driver 
	private IWoyouService driver;
	private ServiceConnection driverConnection;
	private ICallback callback;
	
	
	LinkedList<String> queue = new LinkedList<String>();
	
	/**
	 * constructor
	 * @throws SecurityException
	 * @throws IOException
	 */
	public Printer58mm(CITAQV5Service inService) throws SecurityException, IOException {
		service = inService;
		queue = new LinkedList<String>();	
		
		driverConnection = new ServiceConnection() {
			@Override
			public void onServiceDisconnected(ComponentName name) {
				synchronized (Printer58mm.this) {
					queue.clear();
					driver = null;
				}
			}
			
			@Override
			public void onServiceConnected(ComponentName name, IBinder service) {
				synchronized (Printer58mm.this) {
					driver = IWoyouService.Stub.asInterface(service);
					try {
						printNext();
					} catch (IOException e) {
						Log.e(TAG, e.getMessage(), e);
					}
				}
			}
		};
		
		callback =  new ICallback.Stub() {
			@Override
			public void onRunResult(boolean inSuccess) throws RemoteException {
			}

			@Override
			public void onReturnString(String inResult) throws RemoteException {
			}

			@Override
			public void onRaiseException(int inCode, String inMessage) throws RemoteException {
			}
		};
		
		// connect service
		Intent intent=new Intent();
		intent.setPackage("woyou.aidlservice.jiuiv5");
		intent.setAction("woyou.aidlservice.jiuiv5.IWoyouService");
		
		Application app = service.getApplication();
		app.startService(intent);
		app.bindService(intent, driverConnection, Context.BIND_AUTO_CREATE);
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
		if ( driverConnection != null ) {
			service.getApplication().unbindService(driverConnection);
			driverConnection = null;
		}
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
			return 48.0/32.0;
		}
	}

	@Override
	public void setFont(int inFont) throws IOException {
	}

	@Override
	public void setStyle(int inStyle) throws IOException {
	}
	
	private void printNext() throws IOException {		
		if ( driver != null ) {
			while ( !queue.isEmpty() ) {
				String next = queue.removeFirst();
				try {
					driver.printText(next, callback);
				} catch (RemoteException e) {
					throw new IOException(e.getMessage(),e);
				}
			}
		}
	}
	
	@Override
	public synchronized void writeln(String inText) throws IOException {
		if ( driverConnection == null )
			throw new IOException("Printer not connected");
		
		if ( inText == null || inText.isEmpty() ) {
			inText = "\n";
		} else {
			StringBuilder b;
			b = new StringBuilder(inText);
			b.append("\n");
			inText = b.toString();
		}
		
		queue.add(inText);
		printNext();
	}
}
