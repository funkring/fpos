
#include <stdio.h>
#include <fcntl.h>
#include <errno.h>
#include <termios.h>
//#include <unistdio.h>

#include "EppBase.h"



#define EN0    1
#define DE1    0

static void s_DesInit(void);
static void scrunch(unsigned char *, unsigned long *);
static void unscrun(unsigned long *, unsigned char *);
static void desfunc(unsigned long *, unsigned long *);
static void cookey(unsigned long *);
static void Deskey(unsigned char *, int);
static void s_des(unsigned char *, unsigned char *);
static void usekey(register unsigned long *from);

static unsigned long KnL[32];
//static unsigned long KnR[32];
//static unsigned long Kn3[32];
/*const static unsigned char Df_Key[24] = {
     0x01,0x23,0x45,0x67,0x89,0xab,0xcd,0xef,
     0xfe,0xdc,0xba,0x98,0x76,0x54,0x32,0x10,
     0x89,0xab,0xcd,0xef,0x01,0x23,0x45,0x67 };
*/
const static unsigned short bytebit[8]  = {
     0200, 0100, 040, 020, 010, 04, 02, 01 };

const static unsigned long bigbyte[24] = {
     0x800000L,     0x400000L,     0x200000L,     0x100000L,
     0x80000L, 0x40000L, 0x20000L, 0x10000L,
     0x8000L,  0x4000L,  0x2000L,  0x1000L,
     0x800L,   0x400L,   0x200L,   0x100L,
     0x80L,         0x40L,         0x20L,         0x10L,
     0x8L,          0x4L,          0x2L,          0x1L };

const static unsigned char pc1[56] = {
     56, 48, 40, 32, 24, 16,  8,    0, 57, 49, 41, 33, 25, 17,
      9,  1, 58, 50, 42, 34, 26,   18, 10,  2, 59, 51, 43, 35,
     62, 54, 46, 38, 30, 22, 14,    6, 61, 53, 45, 37, 29, 21,
     13,  5, 60, 52, 44, 36, 28,   20, 12,  4, 27, 19, 11,  3 };

const static unsigned char totrot[16] = {
     1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28 };

const static unsigned char pc2[48] = {
     13, 16, 10, 23,  0,  4,  2, 27, 14,  5, 20,  9,
     22, 18, 11,  3, 25,  7, 15,  6, 26, 19, 12,  1,
     40, 51, 30, 36, 46, 54, 29, 39, 50, 44, 32, 47,
     43, 48, 38, 55, 33, 52, 45, 41, 49, 35, 28, 31
};

static int CurrentMode;
static unsigned char CurrentKey[8];

static void Deskey(unsigned  char *key, int edf)
//unsigned char *key;
//int edf;
{
     register int i, j, l, m, n;
     unsigned char pc1m[56], pcr[56];
     unsigned long kn[32];

     for ( j = 0; j < 56; j++ ) {
          l = pc1[j];
          m = l & 07;
          pc1m[j] = (key[l >> 3] & bytebit[m]) ? 1 : 0;
          }
     for( i = 0; i < 16; i++ ) {
          if( edf == DE1 ) m = (15 - i) << 1;
          else m = i << 1;
          n = m + 1;
          kn[m] = kn[n] = 0L;
          for( j = 0; j < 28; j++ ) {
               l = j + totrot[i];
               if( l < 28 ) pcr[j] = pc1m[l];
               else pcr[j] = pc1m[l - 28];
               }
          for( j = 28; j < 56; j++ ) {
              l = j + totrot[i];
              if( l < 56 ) pcr[j] = pc1m[l];
              else pcr[j] = pc1m[l - 28];
              }
          for( j = 0; j < 24; j++ ) {
               if( pcr[pc2[j]] ) kn[m] |= bigbyte[j];
               if( pcr[pc2[j+24]] ) kn[n] |= bigbyte[j];
               }
          }
     cookey(kn);
     return;
     }

static void cookey(register unsigned long *raw1)
{
     register unsigned long *cook, *raw0;
     unsigned long dough[32];
     register int i;

     cook = dough;
     for( i = 0; i < 16; i++, raw1++ ) {
          raw0 = raw1++;
          *cook      = (*raw0 & 0x00fc0000L) << 6;
          *cook     |= (*raw0 & 0x00000fc0L) << 10;
          *cook     |= (*raw1 & 0x00fc0000L) >> 10;
          *cook++ |= (*raw1 & 0x00000fc0L) >> 6;
          *cook      = (*raw0 & 0x0003f000L) << 12;
          *cook     |= (*raw0 & 0x0000003fL) << 16;
          *cook     |= (*raw1 & 0x0003f000L) >> 4;
          *cook++ |= (*raw1 & 0x0000003fL);
          }
     usekey(dough);
     return;
     }


static void usekey(register unsigned long *from)
{
     register unsigned long *to, *endp;

     to = KnL, endp = &KnL[32];
     while( to < endp ) *to++ = *from++;
     return;
     }

static void s_des(unsigned char *inblock, unsigned char *outblock)
//unsigned char *inblock, *outblock;
{
     unsigned long work[2];

     scrunch(inblock, work);
     desfunc(work, KnL);
     unscrun(work, outblock);
     return;
}

static void scrunch(register unsigned char *outof, register unsigned long *into)
//register unsigned char *outof;
//register unsigned long *into;
{
     *into      = (*outof++ & 0xffL) << 24;
     *into     |= (*outof++ & 0xffL) << 16;
     *into     |= (*outof++ & 0xffL) << 8;
     *into++ |= (*outof++ & 0xffL);
     *into      = (*outof++ & 0xffL) << 24;
     *into     |= (*outof++ & 0xffL) << 16;
     *into     |= (*outof++ & 0xffL) << 8;
     *into     |= (*outof   & 0xffL);
     return;
}

static void unscrun(register unsigned long *outof, register unsigned char *into)
//register unsigned long *outof;
//register unsigned char *into;
{
     *into++ = (BYTE)((*outof >> 24) & 0xffL);
     *into++ = (BYTE)((*outof >> 16) & 0xffL);
     *into++ = (BYTE)((*outof >>  8) & 0xffL);
     *into++ = (BYTE)( *outof++  & 0xffL);
     *into++ = (BYTE)((*outof >> 24) & 0xffL);
     *into++ = (BYTE)((*outof >> 16) & 0xffL);
     *into++ = (BYTE)((*outof >>  8) & 0xffL);
     *into   = (BYTE)(*outof  & 0xffL);
     return;
}

const static unsigned long SP1[64] = {
     0x01010400L, 0x00000000L, 0x00010000L, 0x01010404L,
     0x01010004L, 0x00010404L, 0x00000004L, 0x00010000L,
     0x00000400L, 0x01010400L, 0x01010404L, 0x00000400L,
     0x01000404L, 0x01010004L, 0x01000000L, 0x00000004L,
     0x00000404L, 0x01000400L, 0x01000400L, 0x00010400L,
     0x00010400L, 0x01010000L, 0x01010000L, 0x01000404L,
     0x00010004L, 0x01000004L, 0x01000004L, 0x00010004L,
     0x00000000L, 0x00000404L, 0x00010404L, 0x01000000L,
     0x00010000L, 0x01010404L, 0x00000004L, 0x01010000L,
     0x01010400L, 0x01000000L, 0x01000000L, 0x00000400L,
     0x01010004L, 0x00010000L, 0x00010400L, 0x01000004L,
     0x00000400L, 0x00000004L, 0x01000404L, 0x00010404L,
     0x01010404L, 0x00010004L, 0x01010000L, 0x01000404L,
     0x01000004L, 0x00000404L, 0x00010404L, 0x01010400L,
     0x00000404L, 0x01000400L, 0x01000400L, 0x00000000L,
     0x00010004L, 0x00010400L, 0x00000000L, 0x01010004L };

const static unsigned long SP2[64] = {
     0x80108020L, 0x80008000L, 0x00008000L, 0x00108020L,
     0x00100000L, 0x00000020L, 0x80100020L, 0x80008020L,
     0x80000020L, 0x80108020L, 0x80108000L, 0x80000000L,
     0x80008000L, 0x00100000L, 0x00000020L, 0x80100020L,
     0x00108000L, 0x00100020L, 0x80008020L, 0x00000000L,
     0x80000000L, 0x00008000L, 0x00108020L, 0x80100000L,
     0x00100020L, 0x80000020L, 0x00000000L, 0x00108000L,
     0x00008020L, 0x80108000L, 0x80100000L, 0x00008020L,
     0x00000000L, 0x00108020L, 0x80100020L, 0x00100000L,
     0x80008020L, 0x80100000L, 0x80108000L, 0x00008000L,
     0x80100000L, 0x80008000L, 0x00000020L, 0x80108020L,
     0x00108020L, 0x00000020L, 0x00008000L, 0x80000000L,
     0x00008020L, 0x80108000L, 0x00100000L, 0x80000020L,
     0x00100020L, 0x80008020L, 0x80000020L, 0x00100020L,
     0x00108000L, 0x00000000L, 0x80008000L, 0x00008020L,
     0x80000000L, 0x80100020L, 0x80108020L, 0x00108000L };

const static unsigned long SP3[64] = {
     0x00000208L, 0x08020200L, 0x00000000L, 0x08020008L,
     0x08000200L, 0x00000000L, 0x00020208L, 0x08000200L,
     0x00020008L, 0x08000008L, 0x08000008L, 0x00020000L,
     0x08020208L, 0x00020008L, 0x08020000L, 0x00000208L,
     0x08000000L, 0x00000008L, 0x08020200L, 0x00000200L,
     0x00020200L, 0x08020000L, 0x08020008L, 0x00020208L,
     0x08000208L, 0x00020200L, 0x00020000L, 0x08000208L,
     0x00000008L, 0x08020208L, 0x00000200L, 0x08000000L,
     0x08020200L, 0x08000000L, 0x00020008L, 0x00000208L,
     0x00020000L, 0x08020200L, 0x08000200L, 0x00000000L,
     0x00000200L, 0x00020008L, 0x08020208L, 0x08000200L,
     0x08000008L, 0x00000200L, 0x00000000L, 0x08020008L,
     0x08000208L, 0x00020000L, 0x08000000L, 0x08020208L,
     0x00000008L, 0x00020208L, 0x00020200L, 0x08000008L,
     0x08020000L, 0x08000208L, 0x00000208L, 0x08020000L,
     0x00020208L, 0x00000008L, 0x08020008L, 0x00020200L };

const static unsigned long SP4[64] = {
     0x00802001L, 0x00002081L, 0x00002081L, 0x00000080L,
     0x00802080L, 0x00800081L, 0x00800001L, 0x00002001L,
     0x00000000L, 0x00802000L, 0x00802000L, 0x00802081L,
     0x00000081L, 0x00000000L, 0x00800080L, 0x00800001L,
     0x00000001L, 0x00002000L, 0x00800000L, 0x00802001L,
     0x00000080L, 0x00800000L, 0x00002001L, 0x00002080L,
     0x00800081L, 0x00000001L, 0x00002080L, 0x00800080L,
     0x00002000L, 0x00802080L, 0x00802081L, 0x00000081L,
     0x00800080L, 0x00800001L, 0x00802000L, 0x00802081L,
     0x00000081L, 0x00000000L, 0x00000000L, 0x00802000L,
     0x00002080L, 0x00800080L, 0x00800081L, 0x00000001L,
     0x00802001L, 0x00002081L, 0x00002081L, 0x00000080L,
     0x00802081L, 0x00000081L, 0x00000001L, 0x00002000L,
     0x00800001L, 0x00002001L, 0x00802080L, 0x00800081L,
     0x00002001L, 0x00002080L, 0x00800000L, 0x00802001L,
     0x00000080L, 0x00800000L, 0x00002000L, 0x00802080L };

const static unsigned long SP5[64] = {
     0x00000100L, 0x02080100L, 0x02080000L, 0x42000100L,
     0x00080000L, 0x00000100L, 0x40000000L, 0x02080000L,
     0x40080100L, 0x00080000L, 0x02000100L, 0x40080100L,
     0x42000100L, 0x42080000L, 0x00080100L, 0x40000000L,
     0x02000000L, 0x40080000L, 0x40080000L, 0x00000000L,
     0x40000100L, 0x42080100L, 0x42080100L, 0x02000100L,
     0x42080000L, 0x40000100L, 0x00000000L, 0x42000000L,
     0x02080100L, 0x02000000L, 0x42000000L, 0x00080100L,
     0x00080000L, 0x42000100L, 0x00000100L, 0x02000000L,
     0x40000000L, 0x02080000L, 0x42000100L, 0x40080100L,
     0x02000100L, 0x40000000L, 0x42080000L, 0x02080100L,
     0x40080100L, 0x00000100L, 0x02000000L, 0x42080000L,
     0x42080100L, 0x00080100L, 0x42000000L, 0x42080100L,
     0x02080000L, 0x00000000L, 0x40080000L, 0x42000000L,
     0x00080100L, 0x02000100L, 0x40000100L, 0x00080000L,
     0x00000000L, 0x40080000L, 0x02080100L, 0x40000100L };

const static unsigned long SP6[64] = {
     0x20000010L, 0x20400000L, 0x00004000L, 0x20404010L,
     0x20400000L, 0x00000010L, 0x20404010L, 0x00400000L,
     0x20004000L, 0x00404010L, 0x00400000L, 0x20000010L,
     0x00400010L, 0x20004000L, 0x20000000L, 0x00004010L,
     0x00000000L, 0x00400010L, 0x20004010L, 0x00004000L,
     0x00404000L, 0x20004010L, 0x00000010L, 0x20400010L,
     0x20400010L, 0x00000000L, 0x00404010L, 0x20404000L,
     0x00004010L, 0x00404000L, 0x20404000L, 0x20000000L,
     0x20004000L, 0x00000010L, 0x20400010L, 0x00404000L,
     0x20404010L, 0x00400000L, 0x00004010L, 0x20000010L,
     0x00400000L, 0x20004000L, 0x20000000L, 0x00004010L,
     0x20000010L, 0x20404010L, 0x00404000L, 0x20400000L,
     0x00404010L, 0x20404000L, 0x00000000L, 0x20400010L,
     0x00000010L, 0x00004000L, 0x20400000L, 0x00404010L,
     0x00004000L, 0x00400010L, 0x20004010L, 0x00000000L,
     0x20404000L, 0x20000000L, 0x00400010L, 0x20004010L };

const static unsigned long SP7[64] = {
     0x00200000L, 0x04200002L, 0x04000802L, 0x00000000L,
     0x00000800L, 0x04000802L, 0x00200802L, 0x04200800L,
     0x04200802L, 0x00200000L, 0x00000000L, 0x04000002L,
     0x00000002L, 0x04000000L, 0x04200002L, 0x00000802L,
     0x04000800L, 0x00200802L, 0x00200002L, 0x04000800L,
     0x04000002L, 0x04200000L, 0x04200800L, 0x00200002L,
     0x04200000L, 0x00000800L, 0x00000802L, 0x04200802L,
     0x00200800L, 0x00000002L, 0x04000000L, 0x00200800L,
     0x04000000L, 0x00200800L, 0x00200000L, 0x04000802L,
     0x04000802L, 0x04200002L, 0x04200002L, 0x00000002L,
     0x00200002L, 0x04000000L, 0x04000800L, 0x00200000L,
     0x04200800L, 0x00000802L, 0x00200802L, 0x04200800L,
     0x00000802L, 0x04000002L, 0x04200802L, 0x04200000L,
     0x00200800L, 0x00000000L, 0x00000002L, 0x04200802L,
     0x00000000L, 0x00200802L, 0x04200000L, 0x00000800L,
     0x04000002L, 0x04000800L, 0x00000800L, 0x00200002L };

const static unsigned long SP8[64] = {
     0x10001040L, 0x00001000L, 0x00040000L, 0x10041040L,
     0x10000000L, 0x10001040L, 0x00000040L, 0x10000000L,
     0x00040040L, 0x10040000L, 0x10041040L, 0x00041000L,
     0x10041000L, 0x00041040L, 0x00001000L, 0x00000040L,
     0x10040000L, 0x10000040L, 0x10001000L, 0x00001040L,
     0x00041000L, 0x00040040L, 0x10040040L, 0x10041000L,
     0x00001040L, 0x00000000L, 0x00000000L, 0x10040040L,
     0x10000040L, 0x10001000L, 0x00041040L, 0x00040000L,
     0x00041040L, 0x00040000L, 0x10041000L, 0x00001000L,
     0x00000040L, 0x10040040L, 0x00001000L, 0x00041040L,
     0x10001000L, 0x00000040L, 0x10000040L, 0x10040000L,
     0x10040040L, 0x10000000L, 0x00040000L, 0x10001040L,
     0x00000000L, 0x10041040L, 0x00040040L, 0x10000040L,
     0x10040000L, 0x10001000L, 0x10001040L, 0x00000000L,
     0x10041040L, 0x00041000L, 0x00041000L, 0x00001040L,
     0x00001040L, 0x00040040L, 0x10000000L, 0x10041000L };

static void desfunc(register unsigned long *block, register unsigned long *keys)
//register unsigned long *block, *keys;
{
     register unsigned long fval, work, right, leftt;
     register int round;

     leftt = block[0];
     right = block[1];
     work = ((leftt >> 4) ^ right) & 0x0f0f0f0fL;
     right ^= work;
     leftt ^= (work << 4);
     work = ((leftt >> 16) ^ right) & 0x0000ffffL;
     right ^= work;
     leftt ^= (work << 16);
     work = ((right >> 2) ^ leftt) & 0x33333333L;
     leftt ^= work;
     right ^= (work << 2);
     work = ((right >> 8) ^ leftt) & 0x00ff00ffL;
     leftt ^= work;
     right ^= (work << 8);
     right = ((right << 1) | ((right >> 31) & 1L)) & 0xffffffffL;
     work = (leftt ^ right) & 0xaaaaaaaaL;
     leftt ^= work;
     right ^= work;
     leftt = ((leftt << 1) | ((leftt >> 31) & 1L)) & 0xffffffffL;

     for( round = 0; round < 8; round++ ) {
          work  = (right << 28) | (right >> 4);
          work ^= *keys++;
          fval  = SP7[ work         & 0x3fL];
          fval |= SP5[(work >>  8) & 0x3fL];
          fval |= SP3[(work >> 16) & 0x3fL];
          fval |= SP1[(work >> 24) & 0x3fL];
          work  = right ^ *keys++;
          fval |= SP8[ work         & 0x3fL];
          fval |= SP6[(work >>  8) & 0x3fL];
          fval |= SP4[(work >> 16) & 0x3fL];
          fval |= SP2[(work >> 24) & 0x3fL];
          leftt ^= fval;
          work  = (leftt << 28) | (leftt >> 4);
          work ^= *keys++;
          fval  = SP7[ work         & 0x3fL];
          fval |= SP5[(work >>  8) & 0x3fL];
          fval |= SP3[(work >> 16) & 0x3fL];
          fval |= SP1[(work >> 24) & 0x3fL];
          work  = leftt ^ *keys++;
          fval |= SP8[ work         & 0x3fL];
          fval |= SP6[(work >>  8) & 0x3fL];
          fval |= SP4[(work >> 16) & 0x3fL];
          fval |= SP2[(work >> 24) & 0x3fL];
          right ^= fval;
          }

     right = (right << 31) | (right >> 1);
     work = (leftt ^ right) & 0xaaaaaaaaL;
     leftt ^= work;
     right ^= work;
     leftt = (leftt << 31) | (leftt >> 1);
     work = ((leftt >> 8) ^ right) & 0x00ff00ffL;
     right ^= work;
     leftt ^= (work << 8);
     work = ((leftt >> 2) ^ right) & 0x33333333L;
     right ^= work;
     leftt ^= (work << 2);
     work = ((right >> 16) ^ leftt) & 0x0000ffffL;
     leftt ^= work;
     right ^= (work << 16);
     work = ((right >> 4) ^ leftt) & 0x0f0f0f0fL;
     leftt ^= work;
     right ^= (work << 4);
     *block++ = right;
     *block = leftt;
     return;
}

static void s_DesInit(void)
{
     int i;

     for(i=0;i<32;i++){
          KnL[i] = 0L;
     }
     CurrentMode=EN0;
     memset(CurrentKey,0,8);
     Deskey(CurrentKey,CurrentMode);
}

void Epp_des(const unsigned char *input,unsigned char *output, const unsigned char *deskey, int mode)
{
    s_DesInit();
    if(mode!=CurrentMode || memcmp(deskey,CurrentKey,8))
    {
        CurrentMode=mode;
        memcpy(CurrentKey,deskey,8);
        Deskey(CurrentKey,CurrentMode);
    }
    s_des((unsigned char *)input, output);
}

void Epp_TDEA(const BYTE *pbyInData, BYTE *pbyOutData, const BYTE *pbyDesKey, int iKeyLen, char mode)
{
    BYTE abyTemp[8];

    if (8 == iKeyLen)
    {
        Epp_des(pbyInData, pbyOutData, pbyDesKey, mode);
    }
    else if (16 == iKeyLen)
    {
        Epp_des(pbyInData, pbyOutData, pbyDesKey, mode);
        if (EPP_TDEA_ENCRYPT == mode)
        {
            Epp_des(pbyOutData, abyTemp, &pbyDesKey[8], EPP_TDEA_DECRYPT);
        }
        else
        {
            Epp_des(pbyOutData, abyTemp, &pbyDesKey[8], EPP_TDEA_ENCRYPT);
        }
        Epp_des(abyTemp, pbyOutData, pbyDesKey, mode);
    }
    else
    {
        if (EPP_TDEA_ENCRYPT == mode)
        {
            Epp_des(pbyInData, pbyOutData, pbyDesKey, EPP_TDEA_ENCRYPT);
            Epp_des(pbyOutData, abyTemp, &pbyDesKey[8], EPP_TDEA_DECRYPT);
            Epp_des(abyTemp, pbyOutData, &pbyDesKey[16], EPP_TDEA_ENCRYPT);
        }
        else
        {
            Epp_des(pbyInData, pbyOutData, &pbyDesKey[16], EPP_TDEA_DECRYPT);
            Epp_des(pbyOutData, abyTemp, &pbyDesKey[8], EPP_TDEA_ENCRYPT);
            Epp_des(abyTemp, pbyOutData, pbyDesKey, EPP_TDEA_DECRYPT);
        }
    }
}


void Epp_Des16(const BYTE *pbyInData, BYTE *pbyResult, const BYTE *pbyDesKey, char mode)
{
    BYTE strTemp[10];

    if (EPP_TDEA_ENCRYPT == mode)
    {
        Epp_des(pbyInData, pbyResult, pbyDesKey, 1);
        Epp_des(pbyResult, strTemp, &pbyDesKey[8], 0);
        Epp_des(strTemp, pbyResult, pbyDesKey, 1);
    }
    else
    {
        Epp_des(pbyInData, pbyResult, pbyDesKey, 0);
        Epp_des(pbyResult, strTemp, &pbyDesKey[8], 1);
        Epp_des(strTemp, pbyResult, pbyDesKey, 0);
    }
}

void Epp_MultiDes(const BYTE *pbyInData, int iInNum, BYTE *pbyOutData, const BYTE *pbyDesKey, int iKeyLen, char mode)
{
    int i, j;

    for (i=0; i<iInNum; i++)
    {
        j = i<<3;
        Epp_TDEA(&pbyInData[j], &pbyOutData[j], pbyDesKey, iKeyLen, mode);
    }
}

void Epp_ComputeMac16CBC(const BYTE *pbyDataIn, int iDataLen, const BYTE *pbyKeyIn, BYTE *pbyMacOut)
{
    BYTE abyTemp[10];
    int i;

    memset(abyTemp, 0, sizeof(abyTemp));
    for (i=0; i<iDataLen; i++)
    {
        abyTemp[i%8] ^= pbyDataIn[i];
        if (0 == (i+1)%8)
        {
            Epp_Des16(abyTemp, pbyMacOut, pbyKeyIn, EPP_TDEA_ENCRYPT);
            memcpy(abyTemp, pbyMacOut, 8);
        }
    }
    if (0 != (i%8))
    {
        Epp_Des16(abyTemp, pbyMacOut, pbyKeyIn, EPP_TDEA_ENCRYPT);
    }
}


void Epp_ComputeMac(const BYTE *pbyDataIn, int iDataLen, const BYTE *pbyKeyIn, int iKeyLen, BYTE byMode, BYTE *pbyMacOut)
{
    BYTE abyTemp[10];
    int i;

    memset(abyTemp, 0, sizeof(abyTemp));
    for (i=0; i<iDataLen; i++)
    {
        abyTemp[i%8] ^= pbyDataIn[i];
        if (0 == (i+1)%8)
        {
            Epp_TDEA(abyTemp, pbyMacOut, pbyKeyIn, iKeyLen, byMode);
            memcpy(abyTemp, pbyMacOut, 8);
        }
    }
    if (0 != (i%8))
    {
        Epp_TDEA(abyTemp, pbyMacOut, pbyKeyIn, iKeyLen, byMode);
    }
}




struct speed_map {
    unsigned short speed;
    unsigned short value;
};

static const struct speed_map speeds[] = {
    {B0, 0},
    {B50, 50},
    {B75, 75},
    {B110, 110},
    {B134, 134},
    {B150, 150},
    {B200, 200},
    {B300, 300},
    {B600, 600},
    {B1200, 1200},
    {B1800, 1800},
    {B2400, 2400},
    {B4800, 4800},
    {B9600, 9600},
#ifdef    B19200
    {B19200, 19200},
#elif defined(EXTA)
    {EXTA, 19200},
#endif
#ifdef    B38400
    {B38400, 38400/256 + 0x8000U},
#elif defined(EXTB)
    {EXTB, 38400/256 + 0x8000U},
#endif
#ifdef B57600
    {B57600, 57600/256 + 0x8000U},
#endif
#ifdef B115200
    {B115200, 115200/256 + 0x8000U},
#endif
#ifdef B230400
    {B230400, 230400/256 + 0x8000U},
#endif
#ifdef B460800
    {B460800, 460800/256 + 0x8000U},
#endif
#ifdef B921600
    {B921600, 921600/256 + 0x8000U},
#endif
};

#define NUM_SPEEDS         (sizeof(speeds)/sizeof(speeds[0]))

/******************************************************************************
 * Function:        tty_baud_to_value
 *
 * DESCRIPTION:    将Bxxxx定义转换成数值xxxx
 *
 * Input:        波特率定义，例如B115200, B9600, ...
 *
 * Output:        无
 *
 * Returns:        0 : 未定义的波特率
 *                 其它 : 波特率数值
 *
 * Modification history
 * ----------------------------------------------------------------------------
 *    Li.Hua    2008-09-05 12:07:20 ,  Written
 ******************************************************************************/
static unsigned int tty_baud_to_value(speed_t speed)
{
    int i = 0;

    do {
        if (speed == speeds[i].speed) {
            if (speeds[i].value & 0x8000U) {
                return ((unsigned long) (speeds[i].value) & 0x7fffU) * 256;
            }
            return speeds[i].value;
        }
    } while (++i < NUM_SPEEDS);

    return 0;
}

/******************************************************************************
 * Function:        tty_value_to_baud
 *
 * DESCRIPTION:    将波特率数值转换成波特率定义
 *
 * Input:        value : 波特率数值，例如 115200, 9600, ...
 *
 * Output:        无
 *
 * Returns:        0xFFFFFFFF : 不支持改波特率
 *                 其它 : 波特率定义
 *
 * Modification history
 * ----------------------------------------------------------------------------
 *    Li.Hua    2008-09-05 12:09:58 ,  Written
 ******************************************************************************/
static speed_t tty_value_to_baud(unsigned int value)
{
    int i = 0;

    do {
        if (value == tty_baud_to_value(speeds[i].speed)) {
            return speeds[i].speed;
        }
    } while (++i < NUM_SPEEDS);

    return (speed_t) ~0;
}

/******************************************************************************
 * Function:        set_tty_speed
 *
 * DESCRIPTION:    设置串口通信速率
 *
 * Input:        fd : 打开串口的文件句柄
 *                speed : 串口速度，见name_arr中列举的数值
 *
 * Output:        无
 *
 * Returns:        0    : 设置成功
 *                其它 : 设置失败
 *
 * Modification history
 * ----------------------------------------------------------------------------
 *    Li.Hua    2008-09-04 16:12:30 ,  Written
 ******************************************************************************/
int epp_set_tty_speed(int fd, int speed)
{
    int    status;
    speed_t value;
    struct termios   Opt;

    tcgetattr(fd, &Opt);
    value = tty_value_to_baud(speed);
    if (value != ~0) {
        tcflush(fd, TCIOFLUSH);
        cfsetispeed(&Opt, value);
        cfsetospeed(&Opt, value);
        status = tcsetattr(fd, TCSANOW, &Opt);
        if (status != 0) {
            return -1;
        }
        tcflush(fd,TCIOFLUSH);
        return 0;
    }

    return -1;
}

/******************************************************************************
 * Function:    set_tty_property
 *
 * DESCRIPTION:    设置串口属性
 *
 * Input:        fd : 打开串口句柄
 *                 databits : 数据位(5,6,7,8)
 *                parity   : 校验 (N,E,O,S)
 *                stopbits : 停止位 (1,2)
 *
 * Output:        无
 *
 * Returns:        0    : 成功
 *                其它 : 错误返回码
 *
 * Modification history
 * ----------------------------------------------------------------------------
 *    Li.Hua    2008-09-04 16:15:25 ,  Written
 ******************************************************************************/
int epp_tty_property_config(int fd, int baudrate, int databits, int parity, int stopbits, int flow)
{
    struct termios options;
    speed_t value;

    if  ( tcgetattr(fd, &options)  !=  0)
        return -EFAULT;

    value = tty_value_to_baud(baudrate);
    if (value != (speed_t)~0)
    	 cfsetospeed(&options, value);
    else
        return -EINVAL;

    options.c_cflag &= ~CSIZE;
    switch (databits) {
        case 5:
            options.c_cflag |= CS5;
            break;
        case 6:
            options.c_cflag |= CS6;
            break;
        case 7:
            options.c_cflag |= CS7;
            break;
        case 8:
            options.c_cflag |= CS8;
            break;
        default:
            fprintf(stderr, "Unsupported data size\n");
            return -EINVAL;
    }

    switch (parity) {
        case 'n':
        case 'N':
            options.c_cflag &= ~PARENB;   /* Clear parity enable */
            options.c_iflag &= ~INPCK;     /* Enable parity checking */
            break;
        case 'o':
        case 'O':
            options.c_cflag |= (PARODD | PARENB); 
            options.c_iflag |= INPCK;             /* Disnable parity checking */
            break;
        case 'e':
        case 'E':
            options.c_cflag |= PARENB;     /* Enable parity */
            options.c_cflag &= ~PARODD;  
            options.c_iflag |= INPCK;       /* Disnable parity checking */
            break;
        case 'S':
        case 's':  /*as no parity*/
            options.c_cflag &= ~PARENB;
            options.c_cflag &= ~CSTOPB;
            options.c_iflag |= INPCK;
            break;
        default:
            fprintf(stderr, "Unsupported parity\n");
            return -EINVAL;
    }

    switch (stopbits) {
        case 1:
            options.c_cflag &= ~CSTOPB;
            break;
        case 2:
            options.c_cflag |= CSTOPB;
            break;
        default:
            fprintf(stderr, "Unsupported stop bits\n");
            return -EINVAL;
    }

    switch (flow) {
        case 'h':
        case 'H':
            options.c_cflag |= CRTSCTS;
            options.c_iflag &= ~(IXON | IXOFF | IXANY);
            break;
        case 's':
        case 'S':
            options.c_cflag &= ~CRTSCTS;
            options.c_iflag |= IXON | IXOFF | IXANY;
            break;
        case 'n':
        case 'N':
            options.c_cflag &= ~CRTSCTS;
            options.c_iflag &= ~(IXON | IXOFF | IXANY);
            break;
        default:
            fprintf(stderr, "Unsupported flow\n");
            return -EINVAL;
    }

    options.c_lflag &= ~(ICANON);
    options.c_lflag &= ~(ISIG | ECHO | ECHOK | ECHOCTL | ECHONL | ECHOPRT);
    options.c_oflag &= ~(ONLCR | OCRNL | ONOCR | ONLRET | NOFLSH | TOSTOP);
    options.c_iflag &= ~(BRKINT | ICRNL | INLCR | IGNCR);
    options.c_iflag |= IGNBRK;
    options.c_cflag |= CREAD;

    options.c_cc[VTIME] = 0; 
    options.c_cc[VMIN] = 0; /* Update the options and do it NOW */

    if (tcsetattr(fd,TCSANOW, &options) != 0) {
        perror("SetupSerial 3");
        return -EFAULT;
    }

    return 0;
}

