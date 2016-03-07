package com.cloudpos.apidemo.jniinterface;

public class LEDInterface {
	static{
		System.loadLibrary("jni_cloudpos_led");
	}
    public native static int open();
    public native static int close();
    public native static int turnOn(int index);
    public native static int turnOff(int index);
    public native static int getStatus(int index);

}
