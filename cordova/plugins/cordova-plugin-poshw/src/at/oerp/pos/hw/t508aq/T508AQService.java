package at.oerp.pos.hw.t508aq;

import java.io.File;

import com.ctrl.gpio.Ioctl;

import android.app.Application;
import android.os.Build;
import android.util.Log;
import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwDisplay;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwRS232;
import at.oerp.pos.PosHwScale;
import at.oerp.pos.PosHwService;

/**
 *  
 * @author funkring
 * 
 * T508AQ
 */
public class T508AQService extends PosHwService implements CtrlBytes {
	
	private final static String TAG = "T508AQService";
	
	// printer
	private PosHwPrinter   	printer;
	private boolean		    printerFail;
	
	// rs232
	private SerialPortAdapter 	serial;
	private boolean		    	serialFail;
	
	// scale
	private PosHwScale		scale;
	private boolean			scaleFail;
	
	// led display
	private LedDisplayImpl  display;
	private boolean			displayFail;
	
	public static boolean isHardware() {
		return  "LS888".equals(Build.MANUFACTURER);
	}

	@Override
	public synchronized PosHwPrinter getPrinter() {
		if ( printer == null && !printerFail ) {
			// check if printer available
			if ( Ioctl.convertPrinter() == 0 ) {
				try {
					printer = new Printer58mm(this);
				} catch (Exception e) {
					printerFail = true;
					Log.e(TAG, e.getMessage());				
				} 
			} else {
				printerFail = true;
			}
		}
		return printer;
	}

	public T508AQService(Application app) {
		super(app);
	}
	
	@Override
	protected void initService() {
		
	}

	@Override
	protected synchronized void destroyService() {
		if ( printer != null) {
			printer.close();
			printer = null;
		}		
		
		if ( scale != null ) {
			scale.close();
			scale = null;
		}
		
		if ( serial != null ) {
			serial.close();
			serial = null;
		}
		
		if ( display != null ) {
			display.close();
			display = null;
		}
	}

	@Override
	public synchronized PosHwRS232 getSerialPort(int inPort) {
		if ( inPort == 0 ) {
			if ( serial == null && !serialFail ) {
				// check if port available
				if ( Ioctl.convertDB9() == 0 ) { 
					try {
						serial = new SerialPortAdapter(new File("/dev/ttyS2"), 0);
					} catch (Exception e) {
						serialFail = true;
						Log.e(TAG, e.getMessage());			    
					}
				} else {
					serialFail = true;
				}
			}
		}
		return serial;
	}

	@Override
	public int getSerialPortCount() {
		return 1;
	}

	@Override
	public synchronized  PosHwScale getScale() {
		if ( scale == null && !scaleFail ) {
			try {
				scale = new ScaleServiceImpl(this, getSerialPort(0));
			} catch (Exception e) {
				scaleFail = true;
				Log.e(TAG, e.getMessage());	
			}
		}		
		return scale;
	}

	@Override
	public synchronized PosHwDisplay getCustomerDisplay() {
		if ( display == null && !displayFail ) {
			if ( Ioctl.convertLed() == 0 ) {
				try {
					display = new LedDisplayImpl((Printer58mm) getPrinter());
				} catch (Exception e) {
					scaleFail = true;
					Log.e(TAG, e.getMessage());
				}
			} else {
				displayFail = true;
			}
		}
		return display;
	}

	@Override
	public synchronized boolean openCashDrawer() {
		try {
			Ioctl.activate(16, 1);
			Thread.sleep(122);
			Ioctl.activate(16, 0);
		} catch ( InterruptedException e ) {
			try {
				Thread.sleep(66);
			} catch (InterruptedException e1) {
			}
			Ioctl.activate(16, 0);
			Thread.currentThread().interrupt();
		}
		return true;
	}
	
}
