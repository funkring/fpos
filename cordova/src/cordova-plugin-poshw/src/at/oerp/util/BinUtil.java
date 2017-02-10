package at.oerp.util;
 
import java.nio.ByteBuffer;
import java.nio.charset.Charset;


/**
 * primitive type util library
 * @author martin
 *
 */
public final class BinUtil
{
	/**
	 * charset
	 */
	public static Charset UTF8_CHARSET =  Charset.forName("UTF-8");	 
	
	/**
	 * converts byte to unsigned byte
	 * @param in_byte byte to convert
	 * @return converted byte
	 */
	public final static short toUnsignedByte( byte in_byte )
	{
		return (short) (in_byte & 0xFF);
	}
	
	/**
	 * @param in_word
	 * @return word higher value
	 */
	public final static byte getWordHigh( short in_word ) {
		int word = toUnsignedShort(in_word);
		return (byte) (word >> 8);
	}
	
	public final static byte getWordHigh( int in_word ) {
		return getWordHigh((short) in_word);
	}
	
	public final static byte getWordLow( int in_word ) {
		return getWordLow((short) in_word);
	}
	
	/**
	 * @param in_word
	 * @return word lower value
	 */
	public final static byte getWordLow( short in_word ) {
		int word = toUnsignedShort(in_word);
		return (byte) word;
	}
	
	/**
	 * converts short to unsigned short
	 * @param in_short short to convert
	 * @return unigned short
	 */
	public final static int toUnsignedShort( short in_short )
	{
		return (int) (in_short & 0xFFFF); 
	}
	
	/**
	 * converts integer to unsigned integer
	 * @param in_integer integer 
	 * @return unsigned integer
	 */
	public final static long toUnsignedInt( int in_integer )
	{
		return (long) ( in_integer & 0xFFFFFFFFL);
	}
	
	/**
	 * get bit
	 * @param in_byte byte
	 * @param in_bitPos bit pos
	 * @return bit value
	 */
	public final static boolean getBit( byte in_byte, int in_bitPos )
	{	
		//convert value to unsigned
		int value = BinUtil.toUnsignedByte( in_byte);
		
		//mask bit
		return ( ( value >> in_bitPos ) & 1 ) == 1;			
	}

	/**
	 * get bit from array
	 * @param an byte array
	 * @param in index the bit index 
	 * @return true for 1 or false for 0
	 */
	public final static boolean getBit( byte[] in_array, int in_index )
	{
		int bit = in_index % 8;
		int offset =in_index / 8;
		return getBit( in_array[offset], bit );	
	}
	
	/**
	 * set bit to array
	 * @param in_array array with bits
	 * @param in_index bit index
	 * @param in_value value true for 1 and false for 0 
	 */
	public final static void setBit( byte[] in_array, int in_index, boolean in_value )
	{
		int bit = in_index % 8;
		int offset =in_index / 8;
		in_array[offset] = setBit(in_array[offset], bit, in_value);
	}
	

	/**
	 * set bit to passed byte
	 * @param in_byte byte byte where the bit is to set
	 * @param in_bitPos bit pos
	 * @return modified byte with set or unset bit
	 */
	public final static byte setBit( byte in_byte, int in_bitPos, boolean in_value )
	{
	
		
		//get current value
		int value =  BinUtil.toUnsignedByte( in_byte );
		
		//set bit
		if ( in_value )
		{
			value = value | ( 1 << in_bitPos );
		}
		else
		{
			value = value & ~( 1 << in_bitPos ); 
		}
			
		return (byte) value;
	
	}
		
	/**
	 * get bit value from long
	 * @param in_value value
	 * @param in_bitPos bit position
	 * @return true if set or false if unset
	 */
	public final static boolean getBit( long in_flags, int in_bitPos )
	{	
		return ( ( in_flags >> in_bitPos ) & 1 ) == 1;			
	}
	
	/**
	 * set bit to value
	 * @param in_value value with flags
	 * @param in_bitPos bit pos
	 * @return modified byte with set or unset bit
	 */
	public final static long setBit( long in_flags, int in_bitPos, boolean in_value )
	{
		return in_value ? in_flags | ( 1 << in_bitPos ): in_flags & ~( 1 << in_bitPos );		
	}
	
	
	/**
	 * get bits from value
	 * @param in_data byte value
	 * @param in_bitOffset bit start position
	 * @param in_len bit length of bits to read
	 * @return value of bits starting by offset in_bitOffset with length in_len
	 */
	public static int getBits( byte in_data, int in_bitOffset, int in_len )
	{
		int data =  BinUtil.toUnsignedByte( in_data );				
		return ( data >> in_bitOffset ) & (( 1 << in_len )-1);
	}
	
	
	
	/**
	 * setting bits from value
	 * @param in_data byte containing value
	 * @param in_bitOffset bit offset
	 * @param in_len bit length
	 * @param in_value value
	 * @return value with set bits
	 */
	public static byte setBits( byte in_data, int in_bitOffset, int in_len, int in_value )
	{
		int data =  BinUtil.toUnsignedByte( in_data );		
		int mask = (( 1 << in_len )-1);
		
		//mask value to set
		in_value = in_value & mask;
		
		//delete old bits
		data = data & ~(mask<<in_bitOffset);
		
		//set new bits
		data = data | (in_value << in_bitOffset );
		
		return (byte) data;
	}
	
	/**
	 * round bit index to next byte
	 * @return rounded bit index
	 */
	public static int roundBitIndex( int in_bitIndex)
	{
		if ( ( in_bitIndex & 0x7 ) != 0 )
			return ( (in_bitIndex >> 3) << 3)+8;
		
		return in_bitIndex;
	}
	
	/**
	 * read utf8 string
	 * @param in_len length
	 * @return utf8 string
	 */
	public static String readUTF8( ByteBuffer in_buffer, int in_len )
	{
		//limit buffer
		int oldLimit = in_buffer.limit();		
		in_buffer.limit( in_buffer.position() + in_len );
		
		//convert to ascii
		String str =  UTF8_CHARSET.decode( in_buffer  ).toString();
		
		//reset limit
		in_buffer.limit(oldLimit);		
		return str;
	}
	
	/**
	 * get two's-complement representation for given long value, result is encoded into byte-array of the given
	 * length
	 * @param value long value to be encoded
	 * @param numberOfBytesFor2ComplementRepresentation length of resulting byte-array
	 * @return byte array of turnover counter, in two's-complement representation
	 */
	public static byte[] get2ComplementRepForLong(long value,int numberOfBytesFor2ComplementRepresentation) {
	    if (numberOfBytesFor2ComplementRepresentation<1 || (numberOfBytesFor2ComplementRepresentation>8)) {
	      throw new IllegalArgumentException();
	    }
	
	    //create byte buffer, max length 8 bytes (equal to long representation)
	    ByteBuffer byteBuffer = ByteBuffer.allocate(8);
	    byteBuffer.putLong(value);
	    byte[] longRep = byteBuffer.array();
	
	    //if given length for encoding is equal to 8, we are done
	    if (numberOfBytesFor2ComplementRepresentation==8) {
	      return longRep;
	    }
	
	    //if given length of encoding is less than 8 bytes, we truncate the representation (of course one needs to be sure
	    //that the given long value is not larger than the created byte array
	    byte[] byteRep = new byte[numberOfBytesFor2ComplementRepresentation];
	
	    //truncating the 8-bytes long representation
	    System.arraycopy(longRep,8-numberOfBytesFor2ComplementRepresentation,byteRep,0,numberOfBytesFor2ComplementRepresentation);
	    return byteRep;
	}
	
	/**
	 * zero byte buffer
	 * @param ioBuffer
	 */
	public static void zero(ByteBuffer ioBuffer){
		ioBuffer.rewind();
		while (ioBuffer.remaining() > 8)
			ioBuffer.putLong(0);
		while (ioBuffer.remaining() > 0) 
			ioBuffer.put((byte) 0);
		ioBuffer.rewind();
	}
}
