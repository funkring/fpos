package at.oerp.pos.hw.t508aq;

import android.os.Build;
import android.util.Log;
import at.oerp.pos.PosHwPrinter;
import at.oerp.pos.PosHwService;

/**
 *  
 * @author funkring
 * 
 * T508AQ
 */
public class T508AQService extends PosHwService {
	
	private final static String TAG = "T508AQService";
	private PosHwPrinter printer;
	private boolean		 printerFail;
	
	public static boolean isHardware() {
		return  "LS888".equals(Build.MANUFACTURER);
	}

	@Override
	public PosHwPrinter getPrinter() {
		if ( printer == null && !printerFail ) {
			try {
				printer = new Printer58mm();
			} catch (Exception e) {
				Log.e(TAG, e.getMessage());
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
	}
	
}
