package at.oerp.pos.hw.p8000;

import java.io.IOException;

import com.bw.spdev.SpDev;

import android.app.Application;
import android.os.Build;
import android.util.Log;
import at.oerp.pos.PosHwDisplay;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwRS232;
import at.oerp.pos.PosHwScale;
import at.oerp.pos.PosHwService;

public class P8000Service extends PosHwService{
	
	private final static String TAG = "P8000";
	
	// printer
	private Printer58mm printer;
	private boolean 	printerFail;
	private SpDev		spDev;
	
	public static boolean isHardware() {
		return "P8000S".equals(Build.MODEL);
	}
	
	
	public P8000Service(Application app) {
		super(app);
		
	}

	@Override
	protected void initService() {
		spDev = SpDev.getInstance();
		spDev.SpDevCreate();		
		spDev.SpDevSetAppContext(this.app.getApplicationContext());
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
	
	@Override
	public boolean hasNumpad() {
		return true;
	}
}
