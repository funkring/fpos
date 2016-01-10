#ifndef _POS_EPP_N20_H_
#define _POS_EPP_N20_H_

#include "Epp.h"

int pinpad_open(const char *filename);
int pinpad_check_conn();
int pinpad_inject_masterkey(uchar masterindex, char desflag, uchar *keydata, int datalen);
int pinpad_inject_workkey(uchar masterindex, uchar pinindex, uchar macindex, uchar desindex, char desflag, uchar *keydata, int datalen);
int pinpad_get_pinblock(uchar pinindex, short type, char mode, char *amt, char *price, char *pan, char *track2, char *pinblock, short *pinblklen);
int pinpad_get_mac(uchar macindex, uchar *data, short len, uchar *mac);
int pinpad_encrypted_track(uchar desindex, uchar *data, int datalen, uchar *endata);
int pinpad_confirm_amt(char *amt, int len);
int pinpad_clear();
int pinpad_close();
int pinpad_display_string(int x,int y, int size,char *cont,int len);






#endif

