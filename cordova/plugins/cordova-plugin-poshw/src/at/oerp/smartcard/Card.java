package at.oerp.smartcard;

import java.io.IOException;

public abstract class Card {
	
	public static final int MAX_APDU_SIZE = 65544;
	public static final int DEFAULT_BLOCK_SIZE = 256;
	
	protected final byte[] buffer = new byte[1024];
	
    public abstract ATR getATR() throws IOException;
    
    public abstract ResponseAPDU transmit(CommandAPDU inData, byte[] inBuf) throws IOException;
    
    public ResponseAPDU transmit(CommandAPDU inData) throws IOException {
    	return transmit(inData, buffer);
    }

    public abstract void close();
    
    public abstract void open() throws IOException;
   
    /**
     * @return the block size for receive data fragmented
     * over more request. 
     * 
     * @return default is 256 (have to be a power of two)
     */
    public int getBlockSize() {
    	return DEFAULT_BLOCK_SIZE;
    }
    
    // APDU
    
    protected int arrayLength(byte[] b) {
        return (b != null) ? b.length : 0;
    }
    
    protected CommandAPDU createAPDU() {
    	return new CommandAPDU();
    }
    
    public CommandAPDU createAPDU(int cla, int ins, int p1, int p2) {
    	return createAPDU(cla, ins, p1, p2, null, 0, 0, 0);
    }
    
    public CommandAPDU createAPDU(int cla, int ins, int p1, int p2, int ne) {
    	return createAPDU(cla, ins, p1, p2, null, 0, 0, ne);
    }
    
    public CommandAPDU createAPDU(int cla, int ins, int p1, int p2, byte[] data) {
    	return createAPDU(cla, ins, p1, p2, data, 0, arrayLength(data), 0);
    }
    
    public CommandAPDU createAPDU(int cla, int ins, int p1, int p2, byte[] data,
            int dataOffset, int dataLength) {
    	return createAPDU(cla, ins, p1, p2, data, dataOffset, dataLength, 0);
    }
    
    public CommandAPDU createAPDU(int cla, int ins, int p1, int p2, byte[] data, int ne) {
    	return createAPDU(cla, ins, p1, p2, data, 0, arrayLength(data), ne);
    }
    
    public CommandAPDU createAPDU(byte[] inData) {
    	return createAPDU().parse(inData);
    }
    
    public CommandAPDU createAPDU(int cla, int ins, int p1, int p2, byte[] data,
            int dataOffset, int dataLength, int ne) {
    	return createAPDU().init(cla, ins, p1, p2, data, dataOffset, dataLength, ne); 
    }
}
