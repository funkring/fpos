package com.cloudpos.apidemo.jniinterface;

public class HALMsrInterface 
{
	static {
		System.loadLibrary("jni_cloudpos_msr");
	}
	/**
	 * open the device
	 * @return value  >= 0, success in starting the process; value < 0, error code
	 * */
    public native static int msr_open();
    /**
     * close the device
	 * @return value  >= 0, success in starting the process; value < 0, error code
	 * */
    public native static int msr_close();
    /**
     * @param	nTimeout_MS	: time out in milliseconds.
	 * 						  if nTimeout_MS is less then zero, the searching process is infinite.
	 * @return  value  >= 0, success in starting the process; value < 0, error code
	 * */
    public native static int msr_poll(int nTimeout_MS);
    /**
     * get track error
     * @param	nTrackIndex : Track index
	 * @return  value  >= 0, success in starting the process; value < 0, error code
	 * */
    public native static int msr_get_track_error(int nTrackIndex);
    /**
     * get length of track data
     * @param	nTrackIndex : Track index
	 * @return  value  >= 0, success in starting the process; value < 0, error code
	 * */
    public native static int msr_get_track_data_length(int nTrackIndex);
    /**
     * get track data.
     * @param	nTrackIndex : Track index
     * @param	byteArry	: Track data
     * @param	nLength		: Length of track data
	 * @return  value  >= 0, success in starting the process; value < 0, error code
	 * */
    public native static int msr_get_track_data(int nTrackIndex, byte byteArry[], int nLength);
}
