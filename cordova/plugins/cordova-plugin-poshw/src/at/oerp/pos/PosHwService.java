package at.oerp.pos;

import java.io.IOException;

import android.app.Activity;
import android.app.Application;
import android.content.Intent;
import android.util.Log;
import at.oerp.pos.hw.android.AndroidHwService;

public abstract class PosHwService {
	
	private final static String TAG = "PosHwService";

	/**
	 * app instance
	 */
	final protected Application app;
	
	/**
	 * is open yes or no
	 */
	private boolean open;
	
	/**
	 * create right service 
	 * for the right hardware
	 * @return
	 */
	public static PosHwService create(Application app) {
		return new AndroidHwService(app);
	}
	
	
	/**
	 * protected constructor
	 */
	protected PosHwService(Application app) {		
		this.app = app;
	}
	
	/**
	 * @return application context
	 */
	public final Application getApplication() {
		return this.app;
	}
	
	/**
	 * check if it is opened
	 */
	protected void checkState() {
		if ( !open ) {
			throw new IllegalStateException("PosHwService closed");
		}
	}
	
	/**
	 * @return true if is open
	 */
	public boolean isOpen() {
		return open;
	}
	
	/**
	 * open
	 */
	public synchronized void open() {
		if ( !open ) {	
			initService();
			open = true;			
		}
	}
	
	/**
	 * close
	 */
	public synchronized void close() {
		if ( open ) {
			open = false;
			destroyService();
		}
	}
	
	/**
	 * @return true if numpad was available
	 */
	public boolean hasNumpad() {
		return false;
	}
	
	/**
	 * provisioning
	 */
	public void provisioning() throws IOException {
		
	}

	
	/**
	 * init service hook
	 */
	protected abstract void initService();
	
	/**
	 * destroy service hook
	 */
	protected abstract void destroyService();
	
	/**
	 * @return serial port iface for number
	 */
	public abstract PosHwRS232 getSerialPort(int inPort);
	
	/**
	 * @return serial port count
	 */
	public abstract int getSerialPortCount();
	
	/**
	 * @return hw scale
	 */
	public abstract PosHwScale getScale();
	
	/**
	 * 
	 * @return printer or null if printer wasn't supported
	 */
	public abstract PosHwPrinter getPrinter();
	
	/**
	 * @return customer display
	 */
	public abstract PosHwDisplay getCustomerDisplay();

	/**
	 * @return true if cashdrawer was opened
	 */
	public abstract boolean openCashDrawer()
						throws IOException;
	
	
	/**
	 * open external cashdrawer
	 */
	public boolean openExternCashDrawer() {
		try {
			Intent intent = new Intent("at.oerp.poshw.cashdrawer.TRIGGER");
			this.app.sendBroadcast(intent);
			return true;
		} catch ( Throwable e ) {
			Log.e(TAG, e.getMessage(), e);
			return false;
		}
	}
	

	/**
	 * @return the scanner activty
	 */
	public Class<? extends Activity> getScanActivity() {
		return null;
	}
	
	/**
	 * @return true if scanner activity is available
	 */
	public boolean hasScanner() {
		return getScanActivity() != null;
	}
	
	/**
	 * @return true if smart card was supported
	 */
	public boolean hasCardReader() {
		return false;
	}
	
	/**
	 * @return smartcard
	 * @throws IOException
	 */
	public PosHwSmartCard getSmartCard() throws IOException {
		return null;
	}
}
	
