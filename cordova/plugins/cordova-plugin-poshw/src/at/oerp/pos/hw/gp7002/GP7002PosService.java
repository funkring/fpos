package at.oerp.pos.hw.gp7002;

import java.io.IOException;

import android.app.Application;
import android.os.Build;
import android.util.Log;
import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwDisplay;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwRS232;
import at.oerp.pos.PosHwScale;
import at.oerp.pos.PosHwService;

public class GP7002PosService extends PosHwService implements CtrlBytes {

	private final static String TAG = "TS7002";
	
	// printer
	private Printer58mm printer;
	private boolean 	printerFail;
	
	public static boolean isHardware() {
		// Manufacturer Foxconn International Holdings Limited
		return "GP7002".equals(Build.MODEL);
	}

	public GP7002PosService(Application app) {
		super(app);
	}

	
	@Override
	protected void initService() {
		
	}

	@Override
	protected void destroyService() {
		
	}

	@Override
	public PosHwRS232 getSerialPort(int inPort) {
		return null;
	}

	@Override
	public int getSerialPortCount() {
		return 0;
	}

	@Override
	public PosHwScale getScale() {
		return null;
	}

	@Override
	public PosHwPrinter getPrinter() {
		if ( printer == null && !printerFail) {
			try {
				printer = new Printer58mm(this);
			} catch (Exception e) {
				printerFail = true;
				Log.e(TAG, e.getMessage());				
			} 
		}
		return printer;
	}

	@Override
	public PosHwDisplay getCustomerDisplay() {
		return null;
	}

	@Override
	public boolean openCashDrawer() throws IOException {
		return false;
	}

}
