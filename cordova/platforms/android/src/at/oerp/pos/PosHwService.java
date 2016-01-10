package at.oerp.pos;

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
	 * 
	 * @return printer or null if printer wasn't supported
	 */
	public abstract PosHwPrinter getPrinter();
	
	/**
	 * init service hook
	 */
	protected abstract void initService();
	
	/**
	 * destroy service hook
	 */
	protected abstract void destroyService();
}
	
