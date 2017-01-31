package at.oerp.pos;

public interface CtrlBytes {
	
	public static final byte HT 	=	0x09; 
	public static final byte LF 	=	0x0A; 
	public static final byte CR 	= 	0x0D; 
	public static final byte ESC 	= 	0x1B;
	public static final byte DLE 	=	0x10;
	public static final byte GS 	= 	0x1D;
	public static final byte FS 	= 	0x1C;
	public static final byte STX 	= 	0x02;
	public static final byte US 	=	0x1F;
	public static final byte CAN 	= 	0x18;
	public static final byte CLR 	= 	0x0C;
	public static final byte ETX 	=	0x03;
	public static final byte EOT 	= 	0x04;
	public static final byte M 		=   0x4D;	
	public static final byte ACK 	=	0x06;
	public static final byte NAK 	= 	0x15;
	public static final byte ENQ 	= 	0x05;
	public static final byte SOH 	= 	0x01;
	public static final byte NULL 	=	0x00;
	
	public static final byte[] LF_CMD	=	new byte[] { 0x0A };
}
