package at.oerp.pos.hw.ts7003;

import java.io.IOException;

import android.app.Application;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.util.Log;
import at.oerp.pos.CtrlBytes;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwRS232;
import at.oerp.pos.PosHwScale;
import at.oerp.pos.PosHwService;

public class TS7003PosService extends PosHwService implements CtrlBytes {

	
	private final static String TAG = "TS7003";
	
	// printer
	private Printer58mm printer;
	private boolean 	printerFail;
	
	// pos service
	private LedDisplayImpl led;
	private boolean		   ledFail;
	
	public static boolean isHardware() {
		return "PT7003".equals(Build.MODEL);
	}
	
	public TS7003PosService(Application app) {
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
	public LedDisplayImpl getCustomerDisplay() {
		if ( led == null && !ledFail ) {
			try {
				led = new LedDisplayImpl(this);				
			} catch (Exception e) {
				ledFail = true;
				Log.e(TAG, e.getMessage());
			}
		}
		return led;
	}

	@Override
	public void provisioning() {
		
		// get display
		
		LedDisplayImpl led = getCustomerDisplay();
		if ( led == null) return;
		
		
		// load image
		
		Resources res = app.getResources();
		int backgroundImageId = app.getResources().getIdentifier("oerp_480x320", "drawable", app.getPackageName());
		
		BitmapFactory.Options options = new BitmapFactory.Options();
		options.inScaled = false;
		Bitmap bootImage = BitmapFactory.decodeResource(res, backgroundImageId, options);
		
		
		// set image
		
		led.setBootImage(bootImage);
	}
	
	@Override
	public boolean openCashDrawer() throws IOException {
		return false;
	}

}
