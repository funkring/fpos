package com.cloudpos.apidemo.jniinterface;

public class PrinterInterface 
{
	static {
		System.loadLibrary("jni_cloudpos_printer");
	}
	/**
	 * open the device
	 * @return value  >= 0, success in starting the process; value < 0, error code
	 * */
	public native static int PrinterOpen();
	/**
	 * close the device
	 * @return value  >= 0, success in starting the process; value < 0, error code
	 * */
	
	public native static int PrinterClose();
	/**
	 * prepare to print
	 * @return value  >= 0, success in starting the process; value < 0, error code
	 * */
	
	public native static int PrinterBegin();
	/** end to print
	 *  @return value  >= 0, success in starting the process; value < 0, error code
	 * */
	
	public native static int PrinterEnd();
	/**
	 * write the data to the device
	 * @param arryData : data or control command
	 * @param nDataLength : length of data or control command
	 * @return value  >= 0, success in starting the process; value < 0, error code
	 * */
	
	public native static int PrinterWrite(byte arryData[], int nDataLength);
	/**
	 * query the status of printer
	 * return value : < 0 : error code
	 *                = 0 : no paper
	 *                = 1 : has paper
	 *                other value : RFU
	 */
	public native static int PrinterQuery();
}
