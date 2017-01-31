package com.cloudpos.apidemo.jniinterface;





public class SmartCardInterface 
{
	static {
		System.loadLibrary("jni_cloudpos_smartcard");
	}
	/**
	 *  The function initialize the smart card reader
	 *  @return value  >= 0, success in starting the process; value < 0, error code
	 * */
	public native static int smartcardInit();
	/**
	 * The function clean up the resource allocated by card reader.
	 * @return value  >= 0, success in starting the process; value < 0, error code
	 * */
	public native static int smartcardTerminate();
	/**
	 * @param	nTimeout_MS :	time out in milliseconds.
	 * 						  if nTimeout_MS is less then zero, the searching process is infinite.
	 * @param	event		:	card information
	 * @return  value  >= 0, success in starting the process; value < 0, error code	
	 * */
	public native static int smartcardPollEvent(int nTimeout_MS, SmartCardEvent event);
	/**
	 * The function query the max the slot in this smart card reader
	 * @return 	value < 0 : 	error code,
	 * 			value == 0 :	not defined,
	 * 			value > 0 ;		number of slot.
	 * */
	public native static int smartcardQueryMaxNumber();
	/**
	 * The function query whether the smart card is not existent
	 * Attention : not every slot can support this function
	 * @param	nSlotIndex	: Slot index, from 0 to ( MAX_SUPPORT_SLOT - 1 )
	 * @return  value < 0 : 	error code,
	 * 			value == 0 :	not existent,
	 * 			value > 0 ;		be existent.
	 * */
	public native static int smartcardQueryPresence(int nSlotIndex);
	/**
	 * The function open the specified card
	 * @param   nSlotIndex:		Slot index, from 0 to (MAX_SUPPORT_SLOT - 1).
	 * @return  value < 0 : 	error code,
	 * 			value >= 0:		success, return value is a handle.This handle will be employed bye other API as an input parameter
	 * 
	 * */
	public native static int smartcardOpen(int nSlotIndex);
	/**
	 * The function initialize the smart card reader
	 * @param	handle:	return from method of open
	 * @return	value  >= 0, success in starting the process; value < 0, error code
	 * */
	public native static int smartcardClose(int handle);
	/**
	 * @param Handle		: return from method of open
	 * @param byteArrayATR	: ATR
	 * @param info			: card information
	 * @return 	value  >= 0 : ATR length
	 * 			value  < 0 	: error code
	 */
	public native static int smartcardPowerOn(int Handle, byte byteArrayATR[], SmartCardSlotInfo info);
	/**
	 * The function power off the smart card
	 * @param	handle : return from method of open
	 * @return	value  >= 0, success in starting the process; value < 0, error code
	 * */
	
	public native static int smartcardPowerOff(int Handle);
	/**
	 * The function set the slot control information
	 * @param	Handle	：return from method of open
	 * @param	info	：SMART_CARD_SLOT_INFO* pSlotInfo
	 * @return	value  >= 0, success in starting the process; value < 0, error code
	 * */
	
	public native static int smartcardSetSlotInfo(int Handle, SmartCardSlotInfo info);
	/**
	 * @param	Handle		: return from method of open
	 * @param	byteArrayAPDU	:  command of APDU
	 * @param	nAPDULength : length of command of APDU
	 * @param	byteArrayResponse	: response of command of APDU
	 * @return 	value  >= 0 : response data length
	 * 			value  < 0 	: error code
	 */
	public native static int smartcardTransmit(int Handle, byte byteArrayAPDU[], int nAPDULength, byte byteArrayResponse[]);
	
	/**
	 * This function is responsible for reading data from memory card
	 * @param[in]		: int Handle, return from method of open
	 * @param[in]		: unsigned int nAreaType, area type :
	 * 													0 : main memory,
	 * 													1 : protected memory
	 * 													2 : security memory
	 * @param[in][out]	: unsigned char* pDataBuffer : data buffer
	 * @param[in]		: unsigned int nDataLength : data length of expecting reading
	 * @param[in]		: unsigned char cStartAddress : starting address
	 * @return value	: < 0 : error code
	 * 					  >= 0 : data length
	 */
	public native static int smartcardMCRead(int Handle, int nAreaType, byte[] byteArryData, int nDataLength, int nStartAddress);
	
	/**
	 * This function is responsible for writing data to memory card
	 * @param[in]		: int Handle, return from method of open
	 * @param[in]		: unsigned int nAreaType, area type :
	 * 													0 : main memory,
	 * 													1 : protected memory
	 * 													2 : security memory
	 * @param[in]		: unsigned char* pData : data buffer
	 * @param[in]		: unsigned int nDataLength : data length of expecting reading
	 * @param[in]		: unsigned char cStartAddress : starting address
	 * @return value	: < 0 : error code
	 * 					  >= 0 : data length
	 */
	
	public native static int smartcardMCWrite(int Handle, int nAreaType, byte[] byteArryData, int nDataLength, int nStartAddress);
	
	/**
	 * Verification of data
	 * @param[in]		: int Handle, return from method of open
	 * @param[in]		: unsigned char* pData : data buffer
	 * @param[in]		: unsigned int nDataLength : data length
	 * @return value	: < 0 : error code
	 * 					  = 0 : failed in verifying data
	 * 					  > 0 : success
	 */
	public native static int smartcardMCVerify(int Handle, byte byteArrayAPDU[], int nAPDULength);
}
