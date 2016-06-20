package at.oerp.pos.hw.cm550;

import java.io.IOException;

import android.app.Application;
import android.os.Build;
import android.util.Log;
import at.oerp.pos.PosHwDisplay;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwRS232;
import at.oerp.pos.PosHwScale;
import at.oerp.pos.PosHwService;

public class CM550Service extends PosHwService{
	
	private final static String TAG = "CM550";
	
	// printer
	private Printer58mm printer;
	private boolean 	printerFail;
	
	public static boolean isHardware() {
		return "Android Handheld Terminal".equals(Build.MODEL);
	}
	
	
	public CM550Service(Application app) {
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
