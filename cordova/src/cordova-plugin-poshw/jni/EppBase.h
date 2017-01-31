
#ifndef _POS_EPP_BASE_H_
#define _POS_EPP_BASE_H_


#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <time.h>
#include <string.h>
#include <errno.h>
#include <termios.h>

#ifndef BYTE
#define BYTE unsigned char
#endif

#ifndef WORD
#define WORD unsigned short
#endif

#ifndef DWORD
#define DWORD unsigned long
#endif


#define ENCRYPT              0x01
#define DECRYPT              0x00

#define EPP_TDEA_ENCRYPT              0x01
#define EPP_TDEA_DECRYPT              0x00

// mode=1:encrypt; mode=0:decrypt
void Epp_des(const unsigned char *input,unsigned char *output,const unsigned char *deskey,int mode);
void Epp_Des16(const BYTE *pbyInData, BYTE *pbyResult, const BYTE *pbyDesKey, char mode);

void Epp_TDEA(const BYTE *pbyInData, BYTE *pbyOutData, const BYTE *pbyDesKey, int iKeyLen, char mode);

void Epp_MultiDes(const BYTE *pbyInData, int iInNum, BYTE *pbyOutData, const BYTE *pbyDesKey, int iKeyLen, char mode);

void Epp_ComputeMac16CBC(const BYTE *pbyDataIn, int iDataLen, const BYTE *pbyKeyIn, BYTE *pbyMacOut);

void Epp_ComputeMac(const BYTE *pbyDataIn, int iDataLen, const BYTE *pbyKeyIn, int iKeyLen, BYTE byMode, BYTE *pbyMacOut);


int epp_set_tty_speed(int fd, int speed);


int epp_tty_property_config(int fd, int baudrate, int databits, int parity, int stopbits, int flow);


#endif

