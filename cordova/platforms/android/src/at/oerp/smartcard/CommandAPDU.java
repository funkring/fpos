/*
 * Copyright 2005-2006 Sun Microsystems, Inc.  All Rights Reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.  Sun designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Sun in the LICENSE file that accompanied this code.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Sun Microsystems, Inc., 4150 Network Circle, Santa Clara,
 * CA 95054 USA or visit www.sun.com if you need additional information or
 * have any questions.
 */

package at.oerp.smartcard;

import java.util.Arrays;

import at.oerp.util.BinUtil;

/**
 * A command APDU following the structure defined in ISO/IEC 7816-4.
 * It consists of a four byte header and a conditional body of variable length.
 * This class does not attempt to verify that the APDU encodes a semantically
 * valid command.
 *
 * <p>Note that when the expected length of the response APDU is specified
 * in the {@linkplain #CommandAPDU(int,int,int,int,int) constructors},
 * the actual length (Ne) must be specified, not its
 * encoded form (Le). Similarly, {@linkplain #getNe} returns the actual
 * value Ne. In other words, a value of 0 means "no data in the response APDU"
 * rather than "maximum length."
 *
 * <p>This class supports both the short and extended forms of length
 * encoding for Ne and Nc. However, note that not all terminals and Smart Cards
 * are capable of accepting APDUs that use the extended form.
 *
 * <p>For the header bytes CLA, INS, P1, and P2 the Java type <code>int</code>
 * is used to represent the 8 bit unsigned values. In the constructors, only
 * the 8 lowest bits of the <code>int</code> value specified by the application
 * are significant. The accessor methods always return the byte as an unsigned
 * value between 0 and 255.
 *
 * <p>Instances of this class are immutable. Where data is passed in or out
 * via byte arrays, defensive cloning is performed.
 *
 * @see ResponseAPDU
 * @see CardChannel#transmit CardChannel.transmit
 *
 * @since   1.6
 * @author  Andreas Sterbenz
 * @author  JSR 268 Expert Group
 * @author  Martin Reisenhofer
 */
public class CommandAPDU implements java.io.Serializable {

    private static final long serialVersionUID = 398698301286670877L;

    /** @serial */
    protected byte[] apdu;

    // value of nc
    protected transient int nc;

    // value of ne
    protected transient int ne;

    // index of start of data within the apdu array
    protected transient int dataOffset;

    /**
     * Constructs a CommandAPDU 
	 */
    public CommandAPDU() {
    }

    protected void checkArrayBounds(byte[] b, int ofs, int len) {
        if ((ofs < 0) || (len < 0)) {
            throw new IllegalArgumentException
                ("Offset and length must not be negative");
        }
        if (b == null) {
            if ((ofs != 0) && (len != 0)) {
                throw new IllegalArgumentException
                    ("offset and length must be 0 if array is null");
            }
        } else {
            if (ofs > b.length - len) {
                throw new IllegalArgumentException
                    ("Offset plus length exceed array size");
            }
        }
    }

   

    /**
     * Command APDU encoding options:
     *
     * case 1:  |CLA|INS|P1 |P2 |                                 len = 4
     * case 2s: |CLA|INS|P1 |P2 |LE |                             len = 5
     * case 3s: |CLA|INS|P1 |P2 |LC |...BODY...|                  len = 6..260
     * case 4s: |CLA|INS|P1 |P2 |LC |...BODY...|LE |              len = 7..261
     * case 2e: |CLA|INS|P1 |P2 |00 |LE1|LE2|                     len = 7
     * case 3e: |CLA|INS|P1 |P2 |00 |LC1|LC2|...BODY...|          len = 8..65542
     * case 4e: |CLA|INS|P1 |P2 |00 |LC1|LC2|...BODY...|LE1|LE2|  len =10..65544
     *
     * LE, LE1, LE2 may be 0x00.
     * LC must not be 0x00 and LC1|LC2 must not be 0x00|0x00
     */
    protected CommandAPDU parse(byte[] inApdu) {
    	int cla = 0;
    	int ins = 0;
    	int p1 = 0;
    	int p2 = 0;
        int dataOffset = 0;
        int dataLength = 0;
        int ne = 0;
        
        if (inApdu.length < 4) {
            throw new IllegalArgumentException("apdu must be at least 4 bytes long");
        }
        cla = BinUtil.toUnsignedByte(inApdu[0]);
    	ins = BinUtil.toUnsignedByte(inApdu[1]);
    	p1 = BinUtil.toUnsignedByte(inApdu[2]);
    	p2 = BinUtil.toUnsignedByte(inApdu[3]);
        if (inApdu.length > 4 ) {
	        int l1 = BinUtil.toUnsignedByte(inApdu[4]);
	        if (inApdu.length == 5) {
	            // case 2s
	            ne = (l1 == 0) ? 256 : l1;
	        } else {
		        if (l1 != 0) {
		            if (inApdu.length == 4 + 1 + l1) {
		                // case 3s
		            	dataLength = l1;
		                dataOffset = 5;
		            } else if (inApdu.length == 4 + 2 + l1) {
		                // case 4s
		            	dataLength = l1;
		                dataOffset = 5;
		                int l2 = BinUtil.toUnsignedByte(inApdu[apdu.length - 1]);
		                ne = (l2 == 0) ? 256 : l2;
		            } else {
		                throw new IllegalArgumentException
		                    ("Invalid APDU: length=" + inApdu.length + ", b1=" + l1);
		            }
		        } else {
			        if (inApdu.length < 7) {
			            throw new IllegalArgumentException
			                ("Invalid APDU: length=" + inApdu.length + ", b1=" + l1);
			        }
			        int l2 = (BinUtil.toUnsignedByte(inApdu[5]) << 8) | BinUtil.toUnsignedByte(inApdu[6]);
			        if (inApdu.length == 7) {
			            // case 2e
			            ne = (l2 == 0) ? 65536 : l2;			            
			        } else {
				        if (l2 == 0) {
				            throw new IllegalArgumentException("Invalid APDU: length="
				                    + inApdu.length + ", b1=" + l1 + ", b2||b3=" + l2);
				        }
				        if (inApdu.length == 4 + 3 + l2) {
				            // case 3e
				            dataLength = l2;
				            dataOffset = 7;
				        } else if (inApdu.length == 4 + 5 + l2) {
				            // case 4e
				        	dataLength = l2;
				            dataOffset = 7;
				            int leOfs = inApdu.length - 2;
				            int l3 = (BinUtil.toUnsignedByte(inApdu[leOfs]) << 8) | BinUtil.toUnsignedByte(inApdu[leOfs + 1]);
				            ne = (l3 == 0) ? 65536 : l3;
				        } else {
				            throw new IllegalArgumentException("Invalid APDU: length="
				                    + inApdu.length + ", b1=" + l1 + ", b2||b3=" + l2);
				        }
			        }
		        }
	        }
        }
        return init(cla, ins, p1, p2, inApdu, dataOffset, dataLength, ne);
    }
    
    /**
     * INIT APDU
     *  
     *
     * <p>Note that the data bytes are copied to protect against
     * subsequent modification.
     *
     * @param cla the class byte CLA
     * @param ins the instruction byte INS
     * @param p1 the parameter byte P1
     * @param p2 the parameter byte P2
     * @param data the byte array containing the data bytes of the command body
     * @param dataOffset the offset in the byte array at which the data
     *   bytes of the command body begin
     * @param dataLength the number of the data bytes in the command body
     * @param ne the maximum number of expected data bytes in a response APDU
     *
     * @throws NullPointerException if data is null and dataLength is not 0
     * @throws IllegalArgumentException if dataOffset or dataLength are
     *   negative or if dataOffset + dataLength are greater than data.length,
     *   or if ne is negative or greater than 65536,
     *   or if dataLength is greater than 65535
     */
    protected CommandAPDU init(int cla, int ins, int p1, int p2, byte[] data,
            int dataOffset, int dataLength, int ne) {
    	  checkArrayBounds(data, dataOffset, dataLength);
          if (dataLength > 65535) {
              throw new IllegalArgumentException("dataLength is too large");
          }
          if (ne < 0) {
              throw new IllegalArgumentException("ne must not be negative");
          }
          if (ne > 65536) {
              throw new IllegalArgumentException("ne is too large");
          }
          this.ne = ne;
          this.nc = dataLength;
          if (dataLength == 0) {
              if (ne == 0) {
                  // case 1
                  this.apdu = new byte[4];
                  setHeader(cla, ins, p1, p2);
              } else {
                  // case 2s or 2e
                  if (ne <= 256) {
                      // case 2s
                      // 256 is encoded as 0x00
                      byte len = (ne != 256) ? (byte)ne : 0;
                      this.apdu = new byte[5];
                      setHeader(cla, ins, p1, p2);
                      this.apdu[4] = len;
                  } else {
                      // case 2e
                      byte l1, l2;
                      // 65536 is encoded as 0x00 0x00
                      if (ne == 65536) {
                          l1 = 0;
                          l2 = 0;
                      } else {
                          l1 = (byte)(ne >> 8);
                          l2 = (byte)ne;
                      }
                      this.apdu = new byte[7];
                      setHeader(cla, ins, p1, p2);
                      this.apdu[5] = l1;
                      this.apdu[6] = l2;
                  }
              }
          } else {
              if (ne == 0) {
                  // case 3s or 3e
                  if (dataLength <= 255) {
                      // case 3s
                      apdu = new byte[4 + 1 + dataLength];
                      setHeader(cla, ins, p1, p2);
                      apdu[4] = (byte)dataLength;
                      this.dataOffset = 5;
                      System.arraycopy(data, dataOffset, apdu, 5, dataLength);
                  } else {
                      // case 3e
                      apdu = new byte[4 + 3 + dataLength];
                      setHeader(cla, ins, p1, p2);
                      apdu[4] = 0;
                      apdu[5] = (byte)(dataLength >> 8);
                      apdu[6] = (byte)dataLength;
                      this.dataOffset = 7;
                      System.arraycopy(data, dataOffset, apdu, 7, dataLength);
                  }
              } else {
                  // case 4s or 4e
                  if ((dataLength <= 255) && (ne <= 256)) {
                      // case 4s
                      apdu = new byte[4 + 2 + dataLength];
                      setHeader(cla, ins, p1, p2);
                      apdu[4] = (byte)dataLength;
                      this.dataOffset = 5;
                      System.arraycopy(data, dataOffset, apdu, 5, dataLength);
                      apdu[apdu.length - 1] = (ne != 256) ? (byte)ne : 0;
                  } else {
                      // case 4e
                      apdu = new byte[4 + 5 + dataLength];
                      setHeader(cla, ins, p1, p2);
                      apdu[4] = 0;
                      apdu[5] = (byte)(dataLength >> 8);
                      apdu[6] = (byte)dataLength;
                      this.dataOffset = 7;
                      System.arraycopy(data, dataOffset, apdu, 7, dataLength);
                      if (ne != 65536) {
                          int leOfs = apdu.length - 2;
                          apdu[leOfs] = (byte)(ne >> 8);
                          apdu[leOfs + 1] = (byte)ne;
                      } // else le == 65536: no need to fill in, encoded as 0
                  }
              }
          }
          return this;
    }

    protected void setHeader(int cla, int ins, int p1, int p2) {
        apdu[0] = (byte)cla;
        apdu[1] = (byte)ins;
        apdu[2] = (byte)p1;
        apdu[3] = (byte)p2;
    }
    
    /**
     * @return header
     */
    public byte[] getHeader() {
    	return new byte[] { apdu[0], apdu[1], apdu[2], apdu[3] };
    }

    /**
     * Returns the value of the class byte CLA.
     *
     * @return the value of the class byte CLA.
     */
    public int getCLA() {
        return apdu[0] & 0xff;
    }

    /**
     * Returns the value of the instruction byte INS.
     *
     * @return the value of the instruction byte INS.
     */
    public int getINS() {
        return apdu[1] & 0xff;
    }

    /**
     * Returns the value of the parameter byte P1.
     *
     * @return the value of the parameter byte P1.
     */
    public int getP1() {
        return apdu[2] & 0xff;
    }

    /**
     * Returns the value of the parameter byte P2.
     *
     * @return the value of the parameter byte P2.
     */
    public int getP2() {
        return apdu[3] & 0xff;
    }

    /**
     * Returns the number of data bytes in the command body (Nc) or 0 if this
     * APDU has no body. This call is equivalent to
     * <code>getData().length</code>.
     *
     * @return the number of data bytes in the command body or 0 if this APDU
     * has no body.
     */
    public int getNc() {
        return nc;
    }

    /**
     * Returns a copy of the data bytes in the command body. If this APDU as
     * no body, this method returns a byte array with length zero.
     *
     * @return a copy of the data bytes in the command body or the empty
     *    byte array if this APDU has no body.
     */
    public byte[] getData() {
        byte[] data = new byte[nc];
        System.arraycopy(apdu, dataOffset, data, 0, nc);
        return data;
    }
    
    /**
     * @return current APDU (no clone)
     */
    public byte[] getApdu() {
    	return apdu;
    }
    
    /**
     * Returns the maximum number of expected data bytes in a response
     * APDU (Ne).
     *
     * @return the maximum number of expected data bytes in a response APDU.
     */
    public int getNe() {
        return ne;
    }

    /**
     * Returns a copy of the bytes in this APDU.
     *
     * @return a copy of the bytes in this APDU.
     */
    public byte[] getBytes() {
        return apdu.clone();
    }

    /**
     * Returns a string representation of this command APDU.
     *
     * @return a String representation of this command APDU.
     */
    public String toString() {
        return "CommmandAPDU: " + apdu.length + " bytes, nc=" + nc + ", ne=" + ne;
    }

    /**
     * Compares the specified object with this command APDU for equality.
     * Returns true if the given object is also a CommandAPDU and its bytes are
     * identical to the bytes in this CommandAPDU.
     *
     * @param obj the object to be compared for equality with this command APDU
     * @return true if the specified object is equal to this command APDU
     */
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj instanceof CommandAPDU == false) {
            return false;
        }
        CommandAPDU other = (CommandAPDU)obj;
        return Arrays.equals(this.apdu, other.apdu);
     }

    /**
     * Returns the hash code value for this command APDU.
     *
     * @return the hash code value for this command APDU.
     */
    public int hashCode() {
        return Arrays.hashCode(apdu);
    }

    private void readObject(java.io.ObjectInputStream in)
            throws java.io.IOException, ClassNotFoundException {
        byte[] inData = (byte[])in.readUnshared();
        // initialize transient fields
        parse(inData);
    }

}