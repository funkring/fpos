package at.oerp.pos;

import java.io.IOException;

import android.app.Application;
import at.oerp.pos.hw.android.AndroidHwService;
import at.oerp.pos.hw.cm550.CM550Service;
import at.oerp.pos.hw.cpos800.CPOS800Service;
import at.oerp.pos.hw.gp7002.GP7002PosService;
import at.oerp.pos.hw.h510.H510PosService;
import at.oerp.pos.hw.p8000.P8000Service;
import at.oerp.pos.hw.st808.ST808Service;
import at.oerp.pos.hw.t508aq.T508AQService;
import at.oerp.pos.hw.ts7002.TS7002PosService;
import at.oerp.pos.hw.ts7003.TS7003PosService;

public abstract class PosHwService {
	
	final protected Application app;
	
	private boolean open;
	
	/**
	 * create right service 
	 * for the right hardware
	 * @return
	 */
	public static PosHwService create(Application app) {
		if ( T508AQService.isHardware() ) {
			return new T508AQService(app);
		} else if ( H510PosService.isHardware() ) {
			return new H510PosService(app);
		} else if ( TS7002PosService.isHardware() ) {
			return new TS7002PosService(app);
		} else if ( TS7003PosService.isHardware() ) {
			return new TS7003PosService(app);
		} else if ( CPOS800Service.isHardware() ) {
			return new CPOS800Service(app);
		} else if ( ST808Service.isHardware() ) {
			return new ST808Service(app);
		} else if ( P8000Service.isHardware() ) {
			return new P8000Service(app);
		} else if ( CM550Service.isHardware() ) {
			return new CM550Service(app);
		} else if ( GP7002PosService.isHardware() ) {
			return new GP7002PosService(app);
		}
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
}
	
