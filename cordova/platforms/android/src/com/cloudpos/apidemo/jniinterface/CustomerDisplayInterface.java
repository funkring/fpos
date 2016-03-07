package com.cloudpos.apidemo.jniinterface;

public class CustomerDisplayInterface {

	static {
		System.loadLibrary("jni_cloudpos_customerdisplay");
	}

	/**
	 * open device return value : NULL : faled in opening device. else : handle
	 * of device
	 * @return value : 0 : success 
	 * 				   < 0 : error code
	 */
	public native static int open();

	/**
	 * write picture point data (one point 4 bytes ARGB)
	 * 
	 * @param[in] : int nHandle : handle of this device.
	 * 
	 * @param[in] char* pData : all point data.
	 * 
	 * @param[in] int nDataLength : point data length. 
	 * @return value : 0 : success 
	 * 				   < 0 : error code
	 */
	public native static int writePic(int nXcoordinate, int nYcoordinate,int nWidth, int nHeight, byte[] pData, int nDataLength);

	/**
	 * 背景色 
	 * @param [in] : int nColor 
	 * @return value : 0 : success 
	 * 				   < 0 : error code
	 * */
	public native static int setBackground(int nColor);
	/**
	 * 蜂鸣器
	 * @return value : 0 : success 
	 * 				   < 0 : error code
	 * */
	public native static int buzzerBeep();
	/**
	 * 后灯
	 * @param[in] : int nValue : 1:open led. 0:close led.
	 * @return value : 0 : success 
	 * 				   < 0 : error code
	 * */
	public native static int ledPower(int nValue);
	/**
	 * 默认屏
	 * @return value : 0 : success 
	 * 				   < 0 : error code
	 * */
	public native static int displayDefaultScreen();

	/**
	 * close the device
	 * 
	 * @param[in] : int nHandle : handle of this device return value : 0 :
	 * success < 0 : error code
	 * @return value : 0 : success 
	 * 				   < 0 : error code
	 */
	public native static int close();

}
