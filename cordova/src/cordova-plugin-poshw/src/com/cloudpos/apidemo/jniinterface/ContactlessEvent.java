package com.cloudpos.apidemo.jniinterface;

public class ContactlessEvent 
{
	public static int nMaxEventDataLength = 0xFF;
	public int nEventID;
	public byte arryEventData[];
	public int nEventDataLength;
	
	public ContactlessEvent()
	{
		arryEventData = new byte[nMaxEventDataLength];
		nEventDataLength = 0;
		nEventID = -1;
	}
}
