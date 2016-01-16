package at.oerp.pos.hw.t508aq;

import java.io.File;
import java.io.IOException;

import com.ctrl.gpio.Ioctl;

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
	private boolean		    serialFail;
	
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
	public PosHwPrinter getPrinter() {
		if ( printer == null && !printerFail ) {
			// check if printer available
			if ( Ioctl.convertPrinter() == 0 ) {
				try {
					printer = new Printer58mm();
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

	@Override
	protected void initService() {
		
	}

	@Override
	protected void destroyService() {
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
	public PosHwRS232 getSerialPort(int inPort) {
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
	public PosHwScale getScale() {
		if ( scale == null && !scaleFail ) {
			try {
				scale = new PosHwScale(getSerialPort(0));
			} catch (Exception e) {
				scaleFail = true;
				Log.e(TAG, e.getMessage());	
			}
		}
		return scale;
	}

	@Override
	public PosHwDisplay getCustomerDisplay() {
		if ( display == null && !displayFail ) {
			if ( Ioctl.convertLed() == 0 ) {
				try {
					display = new LedDisplayImpl( new SerialPortAdapter(new File("/dev/ttyS3"), 0));
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
	public boolean openCashDrawer() {
		Ioctl.activate(16, 1);
		try {
			Thread.sleep(66);
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
