package at.oerp.pos;

import java.io.IOException;

import at.oerp.pos.hw.t508aq.T508AQService;

public abstract class PosHwService {

	private boolean open;
	
	
	/**
	 * create right service 
	 * for the right hardware
	 * @return
	 */
	public static PosHwService create() {
		if ( T508AQService.isHardware() ) {
			return new T508AQService();
		}
		return null;
	}
	
	
	/**
	 * protected constructor
	 */
	protected PosHwService() {		
		
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
	
