

#include <errno.h>
#include "epp.h"
#include "EppBase.h"


typedef struct _EPP_CONFIGURE_
{
    EppAuthKey_t sInitCfg;  // 152 bytes
    int  fd;
    BYTE byFlag;
    BYTE abyMac[7];
}EPP_CONFIGURE;   // 164 bytes

#define EPP_CFG_OK_FLAG        0x3e
#define EPP_CFG_INVALID_FLAG   0xff

#define EPP_RECV_PACKET_MAX_LEN 5050

#define  EPP_SEND_BUFFLEN      (8*1024)



#define EPP_RECV_PACKET_TIMER   2


#define CMD_CLEAR_ALL_APP_KEY    0x010c
#define CMD_CLEAR_IDLE_LOGO      0x0115



#define CMD_GET_RANDOM_NUMBER        0x0000
#define CMD_GET_SYSTEM_INFO          0x0001
#define CMD_BEEP                     0x0002
#define CMD_LIGHT                    0x0003

#define CMD_DISPLAY_LOGO             0x0100
#define CMD_CLEAR_SCREEN             0x0101
#define CMD_DISPLAY_STRING           0x0102
#define CMD_LOAD_IDLE_LOGO           0x0103
#define CMD_RESTORE_IDLE_LOGO        0x0104

#define CMD_KB_GET_STRING            0x0200

#define CMD_DOWNLOAD_LCK_MTEK        0x0300
#define CMD_DOWNLOAD_AIK_AUTH1       0x0301
#define CMD_DOWNLOAD_AIK_AUTH2       0x0302
#define CMD_DOWNLOAD_APP_INIT_KEY    0x0303
#define CMD_DKEY_AUTH_STEP1          0x0304
#define CMD_DKEY_AUTH_STEP2          0x0305
#define CMD_DOWNLOAD_KEY             0x0306
#define CMD_DOWNLOAD_DUKPT_KEY       0x0307

#define CMD_FORMAT_PED               0x0340
#define CMD_CLEAR_ALL_ONE_KEY        0x0341
#define CMD_CLEAR_ONE_KEY            0x0342

#define CMD_UKEY_AUTH_STEP1          0x0380
#define CMD_UKEY_AUTH_STEP2          0x0381
#define CMD_GET_MAC                  0x0382
#define CMD_GET_PIN                  0x0383
#define CMD_GET_FIXED_MAC            0x0384
#define CMD_GET_FIXED_PIN            0x0385
#define CMD_GET_DUKPT_MAC            0x0386
#define CMD_GET_DUKPT_PIN            0x0387
#define CMD_SET_PIN_TIMEOUT          0x0388
#define CMD_GET_TDEA                 0x0389
#define CMD_SET_TDES_IV              0x038a

// for factory
#define CMD_ENTER_FACTORY_TEST       0xf100
#define CMD_SET_PED_SN               0xf101
#define CMD_DOWNLOAD_UBSK            0xf102
#define CMD_CLEAR_EEPROM             0xf103



#define RET_MODULE_SYSTEM_INFO      0x00
#define RET_MODULE_KEY_BOARD        0x00
#define RET_MODULE_LCD_SCREEN       0x00
#define RET_MODULE_PED              0x00
#define RET_MODULE_COMMUNICATION    0x00
#define RET_MODULE_IC_CARD          0x00
#define RET_MODULE_MAGIC_CARD       0x00
#define RET_MODULE_FACTORY          0x00

#define KEY_INDEX_NUMBER        100


static BYTE g_EppSendBuff[EPP_SEND_BUFFLEN];
static BYTE g_EppRecvBuff[EPP_SEND_BUFFLEN];


static const WORD g_awEpphalfCrc16CCITT[16]={ /* CRC 半字节余式表 */ 
    0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 
    0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef
};


static const BYTE g_abyEppDefaultLck[16] = {0xde,0x21,0xcb,0x34,0xb6,0x25,0x34,0x33,0x87,0x98,
    0x9b,0xb5,0x39,0x81,0x42,0x49};

static const BYTE g_abyEppDefaultMtek[24] = {0x1a,0xc4,0xb9,0xc8,0x7b,0xde,0x8c,0x27,0x9b,0x4d,
    0xfe,0x3a,0x64,0x8b,0xcf,0x3f,0x93,0xca,0x02,0x2b,0x02,0x56,0x06,0x12};

static const BYTE g_abyEppDefaultAkdak[16]={0x26,0x90,0x77,0xa3,0x33,0x4d,0x32,0xb1,0x14,0xdb,0x04,0x2d,0x1d,0xa0,0x44,0xdb};

static const BYTE g_abyEppDefaultAkuak[16]={0x98,0xa4,0x9f,0xca,0x31,0x2b,0xcc,0x7e,0xa8,0x01,0x66,0xe1,0x8b,0x2b,0x0c,0xa6};

static const BYTE g_abyEppDefaultMdtek[24]={0x75,0x72,0x4d,0xb9,0x3a,0x73,0xe0,0x44,0x6e,0xf6,
    0xb1,0x7c,0xe8,0x1c,0x5d,0x97,0x0b,0xa4,0x4a,0x79,0x8f,0xc8,0xeb,0x18};

static const BYTE g_abyEppDefaultMutek[24]={0xef,0x02,0xb7,0x68,0x8e,0xe1,0x88,0x24,0x0c,0x50,
    0xa8,0xf0,0x22,0x2d,0xaf,0xe5,0x07,0xdd,0xd9,0x97,0x54,0xa8,0xe0,0x2c};

static const BYTE g_abyDefaultAppName[12] = {0x4e,0x45,0x57,0x20,0x50,0x4f,0x53,0x20,0x41,0x50,0x50,0x00};

static const BYTE g_abyEppMainKey[8] = {0x39, 0xc2, 0xb4, 0xf7, 0xd1, 0xb0, 0xe4, 0x84};

static const BYTE g_abySecuryPassword[8] = {0xab,0x87,0x98,0x56,0xcf,0xde,0xa3,0x19};

static BYTE g_abySeed[8] = {0x1a,0xc4,0xb9,0xc8,0x7b,0xde,0x8c,0x27};

static const BYTE g_abyIdleLogoFileHead[62] = 
{
    0x42, 0x4D, 0x3E, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3E, 0x00, 0x00, 0x00, 0x28, 0x00, 
    0x00, 0x00, 0x7A, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00
};

static const BYTE g_abyNormalLogoFileHead[62] = 
{
    0x42, 0x4D, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3E, 0x00, 0x00, 0x00, 0x28, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00
};

//#define SERIAL_PORT_DEBUG


#define RET_FILL(a) {errno=(a);return -(a);}


static int s_EppSends(int fd, const void *SendBuf, uint32_t SendLen)
{
    int iRet;

#ifdef SERIAL_PORT_DEBUG
    int i;
    
    BYTE *pbyBuf = (BYTE*)SendBuf;
    printf("\nSend buff:\n");
    for (i=0; i<SendLen; i++)
    {
        printf("%02x", pbyBuf[i]);
        if (0 == ((i+1)%8))
        {
            printf(" ");
        }
        if (0 == ((i+1)%24))
        {
            printf("\n");
        }
    }
#endif

    iRet = write(fd, (void *)SendBuf, SendLen);
    if (SendLen == iRet)
    {
        RET_FILL(EPP_SUCCESS)
    }
    RET_FILL(EPP_SEND_PACKET_ERROR)
}

static int s_EppRecv(int fd, void *RecvBuf, uint32_t TimeOutMs)
{
    fd_set rfds;
    struct timeval tv;
    int iRet;

    FD_ZERO(&rfds);
    FD_SET(fd, &rfds);

    tv.tv_sec = TimeOutMs/1000;
    tv.tv_usec = (TimeOutMs%1000)*1000;
    iRet = select(fd+1, &rfds, NULL, NULL, &tv);
    switch (iRet)
    {
    case -1:
        perror("select()");
        RET_FILL(EPP_RECV_PACKET_ERROR)
    case 0:
        RET_FILL(EPP_RECV_PACKET_ERROR)
    default:
        if (FD_ISSET(fd,&rfds))
        {
            iRet = read(fd, RecvBuf, 1);
            if (1 == iRet)
            {
                RET_FILL(EPP_SUCCESS)
            }
            else
            {
                RET_FILL(EPP_RECV_PACKET_ERROR)
            }
        }
        RET_FILL(EPP_RECV_PACKET_ERROR)
    }
}

/****************************************************************************
  函数名     :  void Crc16CCITT(BYTE *pbyDataIn, DWORD dwDataLen, BYTE abyCrcOut[2]) 
  描述       :  用移位的方法计算一组数字的16位CRC-CCITT校验值
  输入参数   :  1、BYTE *pbyDataIn : 要进行16位CRC-CCITT计算的数
                2、WORD dwDataLen : pbyDataIn数组的长度最大值65535
  输出参数   :  1、BYTE abyCrcOut[2] : 16位CRC-CCITT计算的结果
  返回值     :  无
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-03-30  V1.0         创建
****************************************************************************/
static void s_EppCrc16CCITT(const BYTE *pbyDataIn, DWORD dwDataLen, BYTE abyCrcOut[2])
{
    WORD wCrc = 0;
    BYTE byTemp;
    while (dwDataLen-- != 0)
    {
        byTemp = ((BYTE)(wCrc>>8))>>4;
        wCrc <<= 4; 
        wCrc ^= g_awEpphalfCrc16CCITT[byTemp^(*pbyDataIn/16)]; 
        byTemp = ((BYTE)(wCrc>>8))>>4;
        wCrc <<= 4;
        wCrc ^= g_awEpphalfCrc16CCITT[byTemp^(*pbyDataIn&0x0f)]; 
        pbyDataIn++; 
    }
    abyCrcOut[0] = wCrc/256;
    abyCrcOut[1] = wCrc%256;    
}

/****************************************************************************
  函数名     :  int Crc16SendPacket(BYTE *pbySendData, WORD wDataLen, BYTE byCmd)
  描述       :  数据包发送函数，带CRC16-CCITT校验
  输入参数   :  1、BYTE *pbySendData：要发送的数据包
                2、WORD wDataLen：数据包长度
                3、BYTE byCmd：命令码
  输出参数   :  无
  返回值     :  SUCCESS：发送成功 / SEND_PACKET_ERROR：发送错误 
                / PACKET_LEN_TOO_LONG
  修改历史   :  
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-03-30  V1.0         创建
****************************************************************************/
static int s_EppCrc16SendPacket(int fd, WORD wDataLen, WORD wCmd)
{
    int iRet;

    if (wDataLen > 8900)
    {
        RET_FILL(EPP_PACKET_LEN_TOO_LONG)
    }
    g_EppSendBuff[0] = 0x02;
    g_EppSendBuff[1] = (BYTE)(wCmd>>8);
    g_EppSendBuff[2] = (BYTE)(wCmd);
    g_EppSendBuff[3] = wDataLen/256;
    g_EppSendBuff[4] = wDataLen%256;
    s_EppCrc16CCITT(&g_EppSendBuff[1], wDataLen+4, &g_EppSendBuff[wDataLen+5]);

    iRet = s_EppSends(fd, g_EppSendBuff, wDataLen+7);
    if (0 != iRet)
    {
        RET_FILL(EPP_SEND_PACKET_ERROR)
    }
    
    RET_FILL(EPP_SUCCESS)
}


/****************************************************************************
  函数名     :  int Crc16RecvPacket(BYTE *pbyRecvData, WORD *pwPacketetLen, DWORD dwTimeoutMs)
  描述       :  数据包接收函数，带CRC16-CCITT校验
  输入参数   :  1、int fd：设备句柄
                2、DWORD dwTimeoutMs：接收超时时间，时间单位是毫秒
  输出参数   :  1、BYTE *pbyRecvData：接收到的所有数据，包括包头和校验，传入
                   的pbyRecvData指向的内存不得小于256字节
                2、WORD *pwPacketetLen：接收到的所有数据的长度
  返回值     :  EPP_SUCCESS / EPP_RECV_TIMEOUT / EPP_RECV_PACKET_ERROR
                 / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR / EPP_CRC_CHECK_ERROR
  修改历史   :  
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
static int s_EppCrc16RecvPacket(int fd, BYTE *pbyRecvData, WORD *pwPacketetLen, DWORD dwTimeoutMs)
{
    BYTE abyCrc[2];
    int i, iRet;
    WORD wPacketLen = 0;
    DWORD dwTimeSec;
    time_t timep1, timep2;

    dwTimeSec = dwTimeoutMs/1000;
    if (dwTimeSec < 2)
    {
        dwTimeSec = 2;
    }
    time(&timep1);
    while (1)
    {
        iRet = s_EppRecv(fd, pbyRecvData, 3); // timeout = 3ms
        if ((0==iRet) && (0x02==pbyRecvData[0]))
        {
            break;
        }
#ifdef SERIAL_PORT_DEBUG
        else if (0 == iRet)
        {
            printf("%02x", pbyRecvData[0]);
        }
#endif
        time(&timep2);
        if ((timep2-timep1) > dwTimeSec)
        {
            RET_FILL(EPP_RECV_TIMEOUT)
        }
    }
    for (i=0; i<4; i++)
    {
        iRet = s_EppRecv(fd, &pbyRecvData[i+1], 50);
        if (0 != iRet)
        {//lcdPrintf("cs012   "); kbGetKey();
#ifdef SERIAL_PORT_DEBUG
    printf("\nRecv buff:\n");
    iRet = i+1;
    for (i=0; i<iRet; i++)
        {
        printf("%02x", pbyRecvData[i]);
        if (0 == ((i+1)%8))
            {
            printf(" ");
            }
        if (0 == ((i+1)%24))
            {
            printf("\n");
            }
        }
#endif
            RET_FILL(EPP_RECV_PACKET_ERROR)
        }
    }
    wPacketLen = pbyRecvData[3]*256 + pbyRecvData[4];
    *pwPacketetLen = wPacketLen + 7;
    if (wPacketLen > 9000)
    {//lcdPrintf("cs013   "); kbGetKey();
#ifdef SERIAL_PORT_DEBUG
    printf("\nRecv buff:\n");
    for (i=0; i<5; i++)
    {
        printf("%02x", pbyRecvData[i]);
        if (0 == ((i+1)%8))
        {
            printf(" ");
        }
        if (0 == ((i+1)%24))
        {
            printf("\n");
        }
    }
#endif
        RET_FILL(EPP_PACKET_LEN_TOO_LONG)
    }
    wPacketLen += 2;

    i = 0;
    time(&timep1);
    while (1)
    {
        iRet = s_EppRecv(fd, &pbyRecvData[i+5], 50);
        if (0 == iRet)
        {
            i++;
        }
        if (i >= wPacketLen)
        {
            break;
        }
        time(&timep2);
        if ((timep2-timep1) > dwTimeSec)
        {
#ifdef SERIAL_PORT_DEBUG
    printf("\nRecv buff:\n");
    iRet = i+5;
    for (i=0; i<iRet; i++)
    {
        printf("%02x", pbyRecvData[i]);
        if (0 == ((i+1)%8))
        {
            printf(" ");
        }
        if (0 == ((i+1)%24))
        {
            printf("\n");
        }
    }
#endif
            RET_FILL(EPP_RECV_TIMEOUT)
        }
    }
    wPacketLen -= 2;
    
#ifdef SERIAL_PORT_DEBUG
    printf("\nRecv buff:\n");
    for (i=0; i<*pwPacketetLen; i++)
    {
        printf("%02x", pbyRecvData[i]);
        if (0 == ((i+1)%8))
        {
            printf(" ");
        }
        if (0 == ((i+1)%24))
        {
            printf("\n");
        }
    }
#endif

    s_EppCrc16CCITT(&pbyRecvData[1], wPacketLen+4, abyCrc);
    if (0 != memcmp(abyCrc, &pbyRecvData[5+wPacketLen], 2))
    {//lcdPrintf("cs015   "); kbGetKey();
        RET_FILL(EPP_CRC_CHECK_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

// 0:OK, 1:error
static int s_check_configure(const EPP_CONFIGURE *pcfg)
{
    BYTE abyMac[10];

    if (NULL == pcfg)
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    if (EPP_CFG_OK_FLAG != pcfg->byFlag)
    {
        RET_FILL(EPP_CONFIGURE_INVALID)
    }
    Epp_ComputeMac((BYTE*)pcfg, sizeof(EPP_CONFIGURE)-8, g_abyEppMainKey, 1, EPP_TDEA_ENCRYPT, abyMac);
    if (0 == memcmp(pcfg->abyMac,abyMac,7))
    {
        RET_FILL(EPP_SUCCESS)
    }
    RET_FILL(EPP_CONFIGURE_MAC_ERROR)
}

static int s_set_configure(EPP_CONFIGURE *pcfg)
{
    BYTE abyMac[10];
    
    pcfg->byFlag = EPP_CFG_OK_FLAG;
    Epp_ComputeMac((BYTE*)pcfg, sizeof(EPP_CONFIGURE)-8, g_abyEppMainKey, 1, EPP_TDEA_ENCRYPT, abyMac);
    memcpy(pcfg->abyMac, abyMac, 7);
    RET_FILL(EPP_SUCCESS)
}

static EPP_CONFIGURE *s_add_default_configure(int fd)
{
    EPP_CONFIGURE *pcfg;
    
    pcfg = (typeof(pcfg))malloc (sizeof(*pcfg));
    if (NULL == pcfg)
    {
        close(fd);
        return NULL;
    }
    memset(pcfg, 0, sizeof(*pcfg));
    pcfg->fd = fd;
    memcpy(pcfg->sInitCfg.AppName, g_abyDefaultAppName,  sizeof(g_abyDefaultAppName ));
    memcpy(pcfg->sInitCfg.Lck,     g_abyEppDefaultLck,   sizeof(g_abyEppDefaultLck  ));
    memcpy(pcfg->sInitCfg.Mtek,    g_abyEppDefaultMtek,  sizeof(g_abyEppDefaultMtek ));
    memcpy(pcfg->sInitCfg.Akdak,   g_abyEppDefaultAkdak, sizeof(g_abyEppDefaultAkdak));
    memcpy(pcfg->sInitCfg.Akuak,   g_abyEppDefaultAkuak, sizeof(g_abyEppDefaultAkuak));
    memcpy(pcfg->sInitCfg.Mdtek,   g_abyEppDefaultMdtek, sizeof(g_abyEppDefaultMdtek));
    memcpy(pcfg->sInitCfg.Mutek,   g_abyEppDefaultMutek, sizeof(g_abyEppDefaultMutek));
    s_set_configure(pcfg);
    return pcfg;
}

static void s_get_rand(BYTE *pbyOut)
{
    BYTE abyTemp[8];
    time_t timep;
    int i;
    
    time(&timep);
    abyTemp[0] = (BYTE)(timep>>24);
    abyTemp[1] = (BYTE)(timep>>16);
    abyTemp[2] = (BYTE)(timep>>8);
    abyTemp[3] = (BYTE)(timep);
    memcpy(&abyTemp[4], g_EppRecvBuff, 4);
    for (i=0; i<8; i++)
    {
        abyTemp[i] ^= g_abySeed[i];
    }
    Epp_TDEA(abyTemp, pbyOut, g_abyEppMainKey, 1, EPP_TDEA_ENCRYPT);
    memcpy(abyTemp, g_abySeed, 8);
}

static void s_EppLoadKeyInitial(const BYTE *pbyKsnIn, BYTE byKsnLen, 
                      const BYTE *pbyBdkIn, BYTE *pbyKeyOut, BYTE *abyCurKSNOut)
{
    BYTE abyTemp[16], abyCurBdk[16];
    int i;

    memcpy(abyCurBdk, (BYTE*)pbyBdkIn, 16);
    memset(abyCurKSNOut, 0xff, 10);
    memcpy(&abyCurKSNOut[10-byKsnLen], (BYTE*)pbyKsnIn, byKsnLen);
    memset(&abyCurKSNOut[8], 0, 2);
    abyCurKSNOut[7] &= 0xe0;
    Epp_TDEA(abyCurKSNOut, pbyKeyOut, abyCurBdk, 16, EPP_TDEA_ENCRYPT);
    for (i=0; i<4; i++)
    {
        abyTemp[i] = abyCurBdk[i]^0xc0;
        abyTemp[i+4] = abyCurBdk[i+4];
        abyTemp[i+8] = abyCurBdk[i+8]^0xc0;
        abyTemp[i+12] = abyCurBdk[i+12];
    }
    Epp_TDEA(abyCurKSNOut, &pbyKeyOut[8], abyTemp, 16, EPP_TDEA_ENCRYPT);
}

/****************************************************************************
  函数名     :  EPP_CONFIGURE *epp_open(const char *filename, int oflag, ...)
  描述       :  打开密码键盘的设备口，对于NEW7110，设备名一般是“/dev/ttyS4”
                或者“/dev/ttyS4”，参数是O_RDWR
  输入参数   :  1、const char *filename ：密码键盘设备名
                2、int oflag ：打开的参数。O_RDWR
  输出参数   :  无
  返回值     :  失败则返回空指针，成功则返回打开后的配置句柄
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
EPP_CONFIGURE *epp_open(const char *filename, int oflag)
{
    int fd, iRet;
    if ((0!=memcmp(filename,"/dev/ttyS",9)) && (0!=memcmp(filename,"/dev/ttyUSB",11)))
    {
        return NULL;
    }
    fd = open(filename, oflag);
    if (fd < 0)
    {
//        printf("open serial port error");
        return NULL;
    }
    iRet = epp_tty_property_config(fd, 115200, 8, 'n', 1, 'n');
    if (0 != iRet)
    {
        close(fd);
//        printf("Set serial port parameter error");
        return NULL;
    }
    return s_add_default_configure(fd);
}

/****************************************************************************
  函数名     :  int epp_close(EPP_CONFIGURE *cfg)
  描述       :  关闭密码键盘设备和释放资源
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  EPP_SUCCESS / -EPP_CLOSE_FAILED
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_close(EPP_CONFIGURE *cfg)
{
    if (NULL != cfg)
    {
        close(cfg->fd);
        memset(cfg, 0, sizeof(*cfg));
        free(cfg);
        RET_FILL(EPP_SUCCESS)
    }
    else
    {
        RET_FILL(EPP_CLOSE_FAILED)
    }
}

/****************************************************************************
  函数名     :  int epp_init(EPP_CONFIGURE *cfg, const EppAuthKey_t *eppkey)
  描述       :  修改当前密钥配置，如果不使用默认配置，每次设备启动都要初始化配置；
                如果使用默认的配置，则无需调用此接口。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、const EppAuthKey_t *eppkey ：初始密钥信息
  输出参数   :  无
  返回值     :  EPP_SUCCESS / -1
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_init(EPP_CONFIGURE *cfg, const EppAuthKey_t *eppkey)
{
    if (NULL == cfg)
    {
        cfg->sInitCfg = *eppkey;
        s_set_configure(cfg);
        RET_FILL(EPP_SUCCESS)
    }
    else
    {
        RET_FILL(1)
    }
}

/****************************************************************************
  函数名     :  int epp_download_lck_mtek(EPP_CONFIGURE *cfg)
  描述       :  将当前配置中的LCK和MTEK下载到N20上
  ?淙氩问?   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  EPP_SUCCESS / -EPP_CFG_ERROR / -EPP_SEND_CMD_ERROR / -EPP_RECV_TIMEOUT / -EPP_RECV_PACKET_ERROR
                 / -EPP_PACKET_LEN_TOO_LONG / -EPP_RECV_PACKET_ERROR / -EPP_CRC_CHECK_ERROR
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_download_lck_mtek(EPP_CONFIGURE *cfg)
{
    int iRet;
    WORD wRecvLen;

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }

    memcpy(&g_EppSendBuff[5], cfg->sInitCfg.Lck, 16);
    memcpy(&g_EppSendBuff[21], cfg->sInitCfg.Mtek, 24);
    iRet = s_EppCrc16SendPacket(cfg->fd, 40, CMD_DOWNLOAD_LCK_MTEK);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as011"); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 100000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as012"); kbGetKey();
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_download_aik(EPP_CONFIGURE *cfg)
  描述       :  将当前配置中的AIK下载到N20上
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_AUTHEN_FAILED
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_download_aik(EPP_CONFIGURE *cfg)
{
    int iRet;
    WORD wRecvLen;
    BYTE abyRand[10], abyTek[64], abyMac[8];

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }

    s_get_rand(&g_EppSendBuff[5]);
    memcpy(abyRand, &g_EppSendBuff[5], 8);
    iRet = s_EppCrc16SendPacket(cfg->fd, 8, CMD_DOWNLOAD_AIK_AUTH1);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (75 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    Epp_TDEA(&g_EppRecvBuff[9], &g_EppSendBuff[20], cfg->sInitCfg.Lck, 16, EPP_TDEA_DECRYPT);
    if (0 != memcmp(abyRand,&g_EppSendBuff[20],8))
    {
        RET_FILL(EPP_AUTHEN_FAILED)
    }
    
    Epp_MultiDes(&g_EppRecvBuff[25], 6, abyTek, cfg->sInitCfg.Mtek, 24, EPP_TDEA_DECRYPT);
    
    Epp_TDEA(&g_EppRecvBuff[17], &g_EppSendBuff[9], cfg->sInitCfg.Lck, 16, EPP_TDEA_ENCRYPT);
    g_EppSendBuff[5] = 0;
    g_EppSendBuff[6] = 0;
    g_EppSendBuff[7] = RET_MODULE_PED;
    g_EppSendBuff[8] = 0;
    iRet = s_EppCrc16SendPacket(cfg->fd, 12, CMD_DOWNLOAD_AIK_AUTH2);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8]);
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }

    memset(g_EppRecvBuff, 0, 1024);
    memcpy(g_EppRecvBuff, cfg->sInitCfg.AppName, 16);
    memcpy(&g_EppRecvBuff[32], cfg->sInitCfg.Akdak, 16);
    Epp_TDEA(&g_EppRecvBuff[500], &g_EppRecvBuff[48], cfg->sInitCfg.Akdak, 16, EPP_TDEA_ENCRYPT);
    memcpy(&g_EppRecvBuff[50], cfg->sInitCfg.Akuak, 16);
    Epp_TDEA(&g_EppRecvBuff[500], &g_EppRecvBuff[66], cfg->sInitCfg.Akuak, 16, EPP_TDEA_ENCRYPT);
    memcpy(&g_EppRecvBuff[68], cfg->sInitCfg.Mdtek, 24);
    Epp_TDEA(&g_EppRecvBuff[500], &g_EppRecvBuff[92], cfg->sInitCfg.Mdtek, 24, EPP_TDEA_ENCRYPT);
    memcpy(&g_EppRecvBuff[94], cfg->sInitCfg.Mutek, 24);
    Epp_TDEA(&g_EppRecvBuff[500], &g_EppRecvBuff[118], cfg->sInitCfg.Mutek, 24, EPP_TDEA_ENCRYPT);
    Epp_MultiDes(g_EppRecvBuff, 15, &g_EppSendBuff[5], abyTek, 24, EPP_TDEA_ENCRYPT);
    
    Epp_ComputeMac(&g_EppSendBuff[5], 120, &abyTek[24], 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[125]);
    memcpy(abyMac, &g_EppSendBuff[125], 8);
    
    iRet = s_EppCrc16SendPacket(cfg->fd, 124, CMD_DOWNLOAD_APP_INIT_KEY);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }

    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 13000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_download_appkey(EPP_CONFIGURE *cfg, const EppAppKey_t *appkey)
  描述       :  下载应用密钥
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、const EppAppKey_t *appkey ：要下载的密钥结构
  输出参数   :  无
  返回值     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_AUTHEN_FAILED
                / EPP_KEY_TYPE_ERROR / EPP_MASTER_KEY_INDEX_ERROR / EPP_KEY_INDEX_ERROR
                / EPP_INPUT_DATA_LEN_ERROR / EPP_CFG_ERROR
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_download_appkey(EPP_CONFIGURE *cfg, const EppAppKey_t *appkey)
{
    int iRet, k;
    BYTE abyRand[10], abyTek[64];
    WORD wRecvLen;

    if ((KEY_TYPE_MASTER!=appkey->KeyType) && (KEY_TYPE_MAC!=appkey->KeyType) 
        && (KEY_TYPE_PIN!=appkey->KeyType) && (KEY_TYPE_FIXED_MAC!=appkey->KeyType)
        && (KEY_TYPE_FIXED_PIN!=appkey->KeyType))
    {
        RET_FILL(EPP_KEY_TYPE_ERROR)
    }
    if ((KEY_TYPE_MASTER!=appkey->KeyType) 
        && ((appkey->MasterKeyIndex>KEY_INDEX_NUMBER)||(0==appkey->MasterKeyIndex)))
    {
        RET_FILL(EPP_MASTER_KEY_INDEX_ERROR)
    }
    if ((appkey->KeyIndex>KEY_INDEX_NUMBER) || (0==appkey->KeyIndex))
    {
        RET_FILL(EPP_KEY_INDEX_ERROR)
    }
    if ((appkey->KeyLen!=8) && (appkey->KeyLen!=16) && (appkey->KeyLen!=24))
    {
        RET_FILL(EPP_INPUT_DATA_LEN_ERROR)
    }

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }

    memset(g_EppSendBuff, 0, 1024);
    memcpy(&g_EppSendBuff[5], cfg->sInitCfg.AppName, 16);
    s_get_rand(&g_EppSendBuff[37]);
//    memset(&g_EppSendBuff[37], 0x31, 8);
    memcpy(abyRand, &g_EppSendBuff[37], 8);
    iRet = s_EppCrc16SendPacket(cfg->fd, 40, CMD_DKEY_AUTH_STEP1);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as031"); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as032=%s,",g_sEppConfigure.abyAppName); kbGetKey();
//        printf("as032=%d,", iRet);
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {//lcdPrintf("as033"); kbGetKey();
//        printf("as033,");
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (75 != wRecvLen)
    {//lcdPrintf("as034"); kbGetKey();
//        printf("as034,");
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    Epp_TDEA(&g_EppRecvBuff[9], &g_EppSendBuff[20], cfg->sInitCfg.Akdak, 16, EPP_TDEA_DECRYPT);
    if (0 != memcmp(abyRand,&g_EppSendBuff[20],8))
    {
/*    lcdCls();
    lcdDisplay(0,0,0,"as035=%02x,%02x,%02x,%02x,%02x,%02x,%02x,%02x,", 
        abyRand[0], abyRand[1], abyRand[2], abyRand[3], abyRand[4], abyRand[5], 
        abyRand[6], abyRand[7]);
    lcdDisplay(0,2,0,"%02x,%02x,%02x,%02x,%02x,%02x,%02x,%02x,", 
        g_EppSendBuff[20], g_EppSendBuff[21], g_EppSendBuff[22], g_EppSendBuff[23],
        g_EppSendBuff[24], g_EppSendBuff[25], g_EppSendBuff[26], g_EppSendBuff[27]); 
    lcdDisplay(0,4,0,"%02x,%02x,%02x,%02x,%02x,%02x,%02x,%02x,", 
        g_EppRecvBuff[9], g_EppRecvBuff[10], g_EppRecvBuff[11], g_EppRecvBuff[12], 
        g_EppRecvBuff[13], g_EppRecvBuff[14], 
        g_EppRecvBuff[15], g_EppRecvBuff[16]);
    kbGetKey();*/
//        printf("as035,");
        RET_FILL(EPP_AUTHEN_FAILED)
    }
    
    Epp_MultiDes(&g_EppRecvBuff[25], 6, abyTek, cfg->sInitCfg.Mdtek, 24, EPP_TDEA_DECRYPT);
    
    Epp_TDEA(&g_EppRecvBuff[17], &g_EppSendBuff[9], cfg->sInitCfg.Akdak, 16, EPP_TDEA_ENCRYPT);
    g_EppSendBuff[5] = 0;
    g_EppSendBuff[6] = 0;
    g_EppSendBuff[7] = RET_MODULE_PED;
    g_EppSendBuff[8] = 0;
    iRet = s_EppCrc16SendPacket(cfg->fd, 12, CMD_DKEY_AUTH_STEP2);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as036"); kbGetKey();
//        printf("as036,");
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as037"); kbGetKey();
 //       printf("as037,");
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {//lcdPrintf("as038"); kbGetKey();
//        printf("as038,");
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {//lcdPrintf("as039"); kbGetKey();
//        printf("as039,");
        RET_FILL(EPP_RECV_LEN_ERROR)
    }

    memset(g_EppRecvBuff, 0, 1024);
    g_EppRecvBuff[0] = appkey->KeyType;  // Key type = fixed mac key
    g_EppRecvBuff[1] = appkey->Mode;  // 
    g_EppRecvBuff[2] = appkey->MasterKeyIndex;  // 
    g_EppRecvBuff[3] = appkey->KeyIndex;  // Key Index = 1;
    g_EppRecvBuff[4] = appkey->KeyLen;  // Key Length=16
    memset(&g_EppRecvBuff[5], 0x13, appkey->KeyLen+4);
    memcpy(&g_EppRecvBuff[5], appkey->KeyData, appkey->KeyLen);
    k = appkey->KeyLen/8;
    k++;
    Epp_MultiDes(g_EppRecvBuff, k, &g_EppSendBuff[5], abyTek, 24, EPP_TDEA_ENCRYPT);
    
    Epp_ComputeMac(&g_EppSendBuff[5], appkey->KeyLen+8, &abyTek[24], 24, EPP_TDEA_ENCRYPT,
        &g_EppSendBuff[appkey->KeyLen+13]);

    iRet = s_EppCrc16SendPacket(cfg->fd, appkey->KeyLen+12, CMD_DOWNLOAD_KEY);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as03a"); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }

    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 30000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as03b"); kbGetKey();
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {//lcdPrintf("as03c"); kbGetKey();
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {//lcdPrintf("as03d"); kbGetKey();
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int EppDownloadDukptKey(EPP_CONFIGURE *cfg, uint32_t KeyIndex,  const void *pBDK, const void *pKSN, 
       uint32_t KSNLen)
  描述       :  应用DUKPT密钥下载
  输入参数   :  1、EPP_CONFIGURE *cfg ：EPP配置句柄指针
                2、uint32_t KeyIndex ：密钥索引，取值范围[1,32]
                3、void *pBDK ：16字节BDK输入，未被发散的BDK
                4、void *pKSN ：KSN内容
                5、uint32_t KSNLen ：KSN长度[1,10]
  输出参数   :  无
  返回值     :  EPP_SUCCESS/EPP_OPEN_FILE_ERROR/EPP_SEEK_FILE_ERROR/EPP_READ_FILE_ERROR/
                EPP_CONFIGURE_INVALID/EPP_CONFIGURE_MAC_ERROR/EPP_SEND_CMD_ERROR/
                EPP_RECV_CMD_ERROR/EPP_RECV_RET_ERROR/EPP_RECV_LEN_ERROR/EPP_AUTHEN_FAILED
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-06-08  V1.0         创建
****************************************************************************/
int epp_download_dukpt_key(EPP_CONFIGURE *cfg, uint32_t KeyIndex,  const void *pBDK, const void *pKSN, 
       uint32_t KSNLen)
{
    int iRet;
    BYTE abyRand[10], abyTek[64], abyInitKey[24], abyCurKsn[16];
    WORD wRecvLen;

    if ((KeyIndex>KEY_INDEX_NUMBER) || (0==KeyIndex))
    {
        RET_FILL(EPP_KEY_INDEX_ERROR)
    }
    if ((KSNLen>10) || (0==KSNLen))
    {
        RET_FILL(EPP_KSN_LEN_ERROR)
    }

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
      
    memset(g_EppSendBuff, 0, 1024);
    memcpy(&g_EppSendBuff[5], cfg->sInitCfg.AppName, 16);
    s_get_rand(&g_EppSendBuff[37]);
//    memset(&g_EppSendBuff[37], 0x31, 8);
    memcpy(abyRand, &g_EppSendBuff[37], 8);
    iRet = s_EppCrc16SendPacket(cfg->fd, 40, CMD_DKEY_AUTH_STEP1);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (75 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    Epp_TDEA(&g_EppRecvBuff[9], &g_EppSendBuff[20], cfg->sInitCfg.Akdak, 16, EPP_TDEA_DECRYPT);
    if (0 != memcmp(abyRand,&g_EppSendBuff[20],8))
    {
        RET_FILL(EPP_AUTHEN_FAILED)
    }
    
    Epp_MultiDes(&g_EppRecvBuff[25], 6, abyTek, cfg->sInitCfg.Mdtek, 24, EPP_TDEA_DECRYPT);
    
    Epp_TDEA(&g_EppRecvBuff[17], &g_EppSendBuff[9], cfg->sInitCfg.Akdak, 16, EPP_TDEA_ENCRYPT);
    g_EppSendBuff[5] = 0;
    g_EppSendBuff[6] = 0;
    g_EppSendBuff[7] = RET_MODULE_PED;
    g_EppSendBuff[8] = 0;
    iRet = s_EppCrc16SendPacket(cfg->fd, 12, CMD_DKEY_AUTH_STEP2);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }

    s_EppLoadKeyInitial(pKSN, KSNLen, pBDK, abyInitKey, abyCurKsn);
    memset(g_EppRecvBuff, 0, 1024);
    g_EppRecvBuff[0] = KeyIndex-1;
    g_EppRecvBuff[1] = 8;  // 
    memcpy(&g_EppRecvBuff[2], abyCurKsn, 8);
    s_EppCrc16CCITT(&g_EppRecvBuff[2], 10, &g_EppRecvBuff[12]);
    g_EppRecvBuff[14] = 16;
    memcpy(&g_EppRecvBuff[15], abyInitKey, 16);

    Epp_MultiDes(g_EppRecvBuff, 5, &g_EppSendBuff[5], abyTek, 24, EPP_TDEA_ENCRYPT);
    
    Epp_ComputeMac(&g_EppSendBuff[5], 40, abyTek, 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[45]);

    iRet = s_EppCrc16SendPacket(cfg->fd, 44, CMD_DOWNLOAD_DUKPT_KEY);
    if (EPP_SUCCESS != iRet)
    {
        return EPP_SEND_CMD_ERROR;
    }

    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 30000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[5])
    {
        return (RET_ERROR_BASE+g_EppRecvBuff[5]);
    }
    if (8 != wRecvLen)
    {
        return EPP_RECV_LEN_ERROR;
    }
    return EPP_SUCCESS;
}

/****************************************************************************
  函数名     :  int epp_get_mac(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex, 
                    uint32_t Mode, const void *pData, size_t DataLen, void *pMacOut)
  描述       :  请求MAC运算
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t KeyType ：密钥类型。KEY_TYPE_MAC/KEY_TYPE_FIXED_MAC/KEY_TYPE_DUKPT
                3、uint32_t KeyIndex ：MAC密钥索引，如果是MAC或者Fixed MAC可取值[1,100]，
                                     如果是DUKPT MAC则可取值[1,32]
                4、BYTE Mode ：运算算法选择
                                     0x00	算法1
                                     0x01	算法2
                                     0x02	EMV2000算法
                                     0x03	中国银联算法
                5、const void *pData ：参与运算的MAC数据
                6、size_t DataLen ：MAC数据长度，必须是8的整数倍，最小值为8，最大值为2024
  输出参数   :  1、void *pMacOut ：8字节MAC运算结果，如果命令码是DUKPT_MAC_KEY，则前8个字节
                   是MAC计算结果，后10个字节是当前KSN。
  返回值     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_INPUT_PARAM_ERROR 
                / EPP_INPUT_CMD_ERROR / EPP_INPUT_KEY_INDEX_ERROR / EPP_INPUT_MAC_LEN_ERROR
                / EPP_INPUT_MODE_ERROR / 
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_get_mac(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex, uint32_t Mode,
				const void *pData, size_t DataLen, void *pMacOut)
{
    int iRet;
    BYTE abyRand[10], abyTek[64];
    WORD wRecvLen;

    if ((KEY_TYPE_MAC!=KeyType) && (KEY_TYPE_FIXED_MAC!=KeyType) && (KEY_TYPE_DUKPT_MAC!=KeyType))
    {
        RET_FILL(EPP_INPUT_CMD_ERROR)
    }
    if ((0==KeyIndex) || (KeyIndex>100))
    {
        RET_FILL(EPP_INPUT_KEY_INDEX_ERROR)
    }

    if ((0!=(DataLen%8)) || (0==DataLen) || (DataLen>2024))
    {
        RET_FILL(EPP_INPUT_MAC_LEN_ERROR)
    }
    if (Mode > 0x03)
    {
        RET_FILL(EPP_INPUT_MODE_ERROR)
    }
    if ((NULL==pData) || (NULL==pMacOut))
    {
        RET_FILL(EPP_INPUT_PARAM_ERROR)
    }

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }


    memset(g_EppSendBuff, 0, 1024);
    memcpy(&g_EppSendBuff[5], cfg->sInitCfg.AppName, 16);
    s_get_rand(&g_EppSendBuff[37]);
    memcpy(abyRand, &g_EppSendBuff[37], 8);
    iRet = s_EppCrc16SendPacket(cfg->fd, 40, CMD_UKEY_AUTH_STEP1);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as021"); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as022"); kbGetKey();
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {//lcdPrintf("as023"); kbGetKey();
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (75 != wRecvLen)
    {//lcdPrintf("as024"); kbGetKey();
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    Epp_TDEA(&g_EppRecvBuff[9], &g_EppSendBuff[20], cfg->sInitCfg.Akuak, 16, EPP_TDEA_DECRYPT);
    if (0 != memcmp(abyRand,&g_EppSendBuff[20],8))
    {//lcdPrintf("as025"); kbGetKey();
        RET_FILL(EPP_AUTHEN_FAILED)
    }
    
	Epp_MultiDes(&g_EppRecvBuff[25], 6, abyTek, cfg->sInitCfg.Mutek, 24, EPP_TDEA_DECRYPT);
	
    Epp_TDEA(&g_EppRecvBuff[17], &g_EppSendBuff[9], cfg->sInitCfg.Akuak, 16, EPP_TDEA_ENCRYPT);
    g_EppSendBuff[5] = 0;
    g_EppSendBuff[6] = 0;
    g_EppSendBuff[7] = RET_MODULE_PED;
    g_EppSendBuff[8] = 0;
    iRet = s_EppCrc16SendPacket(cfg->fd, 12, CMD_UKEY_AUTH_STEP2);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as026"); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as027=%d,", iRet); kbGetKey();
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {//lcdPrintf("as028"); kbGetKey();
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {//lcdPrintf("as029"); kbGetKey();
        RET_FILL(EPP_RECV_LEN_ERROR)
    }

    memset(g_EppRecvBuff, 0, 1024);

    g_EppRecvBuff[0] = KeyIndex;
    g_EppRecvBuff[1] = Mode;  // 
    memcpy(&g_EppRecvBuff[2], pData, DataLen);
//    memset(&g_EppRecvBuff[wMacLen+2], 0x33, 8);
    s_get_rand(&g_EppRecvBuff[DataLen+2]);
    Epp_MultiDes(g_EppRecvBuff, (DataLen+8)/8, &g_EppSendBuff[5], abyTek, 24, EPP_TDEA_ENCRYPT);
    Epp_ComputeMac(&g_EppSendBuff[5], DataLen+8, &abyTek[24], 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[DataLen+13]);
    switch (KeyType)
    {
    case KEY_TYPE_MAC:
        iRet = s_EppCrc16SendPacket(cfg->fd, DataLen+12, CMD_GET_MAC);
        break;
    case KEY_TYPE_FIXED_MAC:
        iRet = s_EppCrc16SendPacket(cfg->fd, DataLen+12, CMD_GET_FIXED_MAC);
        break;
    case KEY_TYPE_DUKPT_MAC:
        iRet = s_EppCrc16SendPacket(cfg->fd, DataLen+12, CMD_GET_DUKPT_MAC);
        break;
    }
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as02a"); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }

    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 30000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as02b"); kbGetKey();
        return iRet;
    }
    if (KEY_TYPE_DUKPT_MAC == KeyType)
    {
        if (35 != wRecvLen)
        {//lcdPrintf("as02f"); kbGetKey();
            RET_FILL(EPP_RECV_LEN_ERROR)
        }
        Epp_ComputeMac(&g_EppRecvBuff[5], 24, &abyTek[24], 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[200]);
        if (0 != memcmp(&g_EppSendBuff[200],&g_EppRecvBuff[29],4))
        {//lcdPrintf("as02g"); kbGetKey();
            RET_FILL(EPP_MAC_CHECK_ERROR)
        }
        Epp_MultiDes(&g_EppRecvBuff[5], 3, &g_EppSendBuff[200], abyTek, 24, EPP_TDEA_DECRYPT);
        if (0 != g_EppSendBuff[203])
        {//lcdPrintf("as02h"); kbGetKey();
            RET_FILL(RET_ERROR_BASE+g_EppSendBuff[203])
        }
        memcpy(pMacOut, &g_EppSendBuff[204], 18);
        RET_FILL(EPP_SUCCESS)
    }
    else
    {
        if (27 != wRecvLen)
        {//lcdPrintf("as02c=%d,%d,", wRecvLen, g_EppRecvBuff[5]); kbGetKey();
            RET_FILL(EPP_RECV_LEN_ERROR)
        }
        Epp_ComputeMac(&g_EppRecvBuff[5], 16, &abyTek[24], 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[200]);
        if (0 != memcmp(&g_EppSendBuff[200],&g_EppRecvBuff[21],4))
        {//lcdPrintf("as02d"); kbGetKey();
            RET_FILL(EPP_MAC_CHECK_ERROR)
        }
        Epp_MultiDes(&g_EppRecvBuff[5], 2, &g_EppSendBuff[200], abyTek, 24, EPP_TDEA_DECRYPT);
        if (0 != g_EppSendBuff[203])
        {//lcdPrintf("as02e=%02x",g_EppSendBuff[203]); kbGetKey();
            RET_FILL(RET_ERROR_BASE+g_EppSendBuff[203])
        }
        memcpy(pMacOut, &g_EppSendBuff[204], 8);
        RET_FILL(EPP_SUCCESS)
    }
}

/****************************************************************************
  函数名     :  int epp_get_pin(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex, uint32_t DisplayMode, 
				uint32_t Mode, const void *pCardInfo, const void *pLenInfo, void *pPinBlockOut)
  描述       :  PIN运算API
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t KeyType ：密钥类型。KEY_TYPE_PIN/KEY_TYPE_FIXED_PIN/KEY_TYPE_DUKPT
                3、uint32_t KeyIndex ：密钥索引，如果是PIN或者Fixed PIN可取值[1,100]，
                                     如果是DUKPT PIN则可取值[1,32]
                4、uint32_t DisplayMode ：PIN显示模式，0表示从左到右，1表示从右到左，2表示居中。
                5、uint32_t AlgMode ：运算算法选择，
                                        0x00表示选择“Format 0模式”算法，
                                        0x01表示选择“Format EMV模式”算法，
                                        0x0a表示选择“Format EPS模式”算法，
                6、const void *pCardInfo ：16卡号信息，缓冲长度必须不小于16字节
                7、const void *pLenInfo ：允许输入的PIN密钥长度枚举值字符串，长度可取值0,4~12，分
                            别用字符'0'，'4'，……，'9'，'a'，'b'，'c'表示。例如填入数据
                            "0456a\0\0\0\0\0\0\0\0"，则表示支持长度为0、4、5、6和10的PIN输入。
                            缓冲长度不小于13字节。
  输出参数   :  1、void *pPinBlockOut ：缓冲长度最小为19字节，前8字节是PIN运算结果；第九个
                   字节表示用户是否输入PIN，如果是0则表示没输入PIN，1表示有输入PIN；
                   如果是DUKPT，则接下来9~18字节是当前KSN
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_get_pin(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex, uint32_t DisplayMode, 
				uint32_t AlgMode, const void *pCardInfo, const void *pLenInfo, void *pPinBlockOut)
{
    int iRet;
    BYTE abyRand[10], abyTek[64], *pbyCardInfo, *pbyLenInfo, *pbyPinBlockOut;
    WORD wRecvLen, wCmd = 0;
//    int i = 0;

    if ((KEY_TYPE_PIN!=KeyType) && (KEY_TYPE_FIXED_PIN!=KeyType) && (KEY_TYPE_DUKPT_PIN!=KeyType))
    {
        RET_FILL(EPP_INPUT_CMD_ERROR)
    }
    if ((0==KeyIndex) || (KeyIndex>100))
    {
        RET_FILL(EPP_INPUT_KEY_INDEX_ERROR)
    }

    if ((0x00!=AlgMode) && (0x0a!=AlgMode) && (0x01!=AlgMode))
    {//lcdPrintf("cs00o   "); kbGetKey();
        RET_FILL(EPP_INPUT_MODE_ERROR)
    }
    if ((NULL==pCardInfo) || (NULL==pLenInfo) || (NULL==pPinBlockOut))
    {//lcdPrintf("cs00n   "); kbGetKey();
        RET_FILL(EPP_INPUT_PARAM_ERROR)
    }
    pbyCardInfo = (BYTE*)pCardInfo;
    pbyLenInfo = (BYTE*)pLenInfo;
    pbyPinBlockOut = (BYTE*)pPinBlockOut;
    if ((pbyLenInfo[0]<'0') || ((pbyLenInfo[0]>'9')&&(pbyLenInfo[0]<'a')) || (pbyLenInfo[0]>'c'))
    {//lcdPrintf("cs00n   "); kbGetKey();
        RET_FILL(EPP_INPUT_PARAM_ERROR)
    }

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }


    memset(g_EppSendBuff, 0, 1024);
    memcpy(&g_EppSendBuff[5], cfg->sInitCfg.AppName, 16);
    s_get_rand(&g_EppSendBuff[37]);
    memcpy(abyRand, &g_EppSendBuff[37], 8);
    iRet = s_EppCrc16SendPacket(cfg->fd, 40, CMD_UKEY_AUTH_STEP1);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("cs00l   "); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("cs00k   "); kbGetKey();
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {//lcdPrintf("cs00j   "); kbGetKey();
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (75 != wRecvLen)
    {//lcdPrintf("cs00i   "); kbGetKey();
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    Epp_TDEA(&g_EppRecvBuff[9], &g_EppSendBuff[20], cfg->sInitCfg.Akuak, 16, EPP_TDEA_DECRYPT);
    if (0 != memcmp(abyRand,&g_EppSendBuff[20],8))
    {//lcdPrintf("cs00f   "); kbGetKey();
        RET_FILL(EPP_AUTHEN_FAILED)
    }
    
    Epp_MultiDes(&g_EppRecvBuff[25], 6, abyTek, cfg->sInitCfg.Mutek, 24, EPP_TDEA_DECRYPT);

    Epp_TDEA(&g_EppRecvBuff[17], &g_EppSendBuff[9], cfg->sInitCfg.Akuak, 16, EPP_TDEA_ENCRYPT);
    g_EppSendBuff[5] = 0;
    g_EppSendBuff[6] = 0;
    g_EppSendBuff[7] = RET_MODULE_PED;
    g_EppSendBuff[8] = 0;
    iRet = s_EppCrc16SendPacket(cfg->fd, 12, CMD_UKEY_AUTH_STEP2);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("cs00e   "); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("cs00c   "); kbGetKey();
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {//lcdPrintf("cs00d=%d   ", g_EppRecvBuff[5]); kbGetKey();
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {//lcdPrintf("cs00b   "); kbGetKey();
        RET_FILL(EPP_RECV_LEN_ERROR)
    }

    memset(g_EppRecvBuff, 0, 1024);
    g_EppRecvBuff[0] = KeyIndex;
    g_EppRecvBuff[1] = AlgMode;  // 
    memcpy(&g_EppRecvBuff[2], pbyCardInfo, 16);
    strcpy((char*)(&g_EppRecvBuff[18]), (char*)pbyLenInfo);
    g_EppRecvBuff[31] = DisplayMode;
    s_get_rand(&g_EppRecvBuff[32]);
    Epp_MultiDes(g_EppRecvBuff, 5, &g_EppSendBuff[5], abyTek, 24, EPP_TDEA_ENCRYPT);
    Epp_ComputeMac(&g_EppSendBuff[5], 40, &abyTek[24], 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[45]);
    
    switch (KeyType)
    {
    case KEY_TYPE_PIN:
        wCmd = CMD_GET_PIN;
        break;
    case KEY_TYPE_FIXED_PIN:
        wCmd = CMD_GET_FIXED_PIN;
        break;
    case KEY_TYPE_DUKPT_PIN:
        wCmd = CMD_GET_DUKPT_PIN;
        break;
    }
    iRet = s_EppCrc16SendPacket(cfg->fd, 44, wCmd);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("cs00a   "); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }

    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 300000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("cs008   "); kbGetKey();
        return iRet;
    }

    if (KEY_TYPE_DUKPT_PIN == KeyType)
    {
        if (35 != wRecvLen)
        {//lcdPrintf("cs008   "); kbGetKey();
            RET_FILL(EPP_RECV_LEN_ERROR)
        }
        Epp_ComputeMac(&g_EppRecvBuff[5], 24, &abyTek[24], 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[200]);
        if (0 != memcmp(&g_EppSendBuff[200],&g_EppRecvBuff[29],4))
        {//lcdPrintf("cs007   "); kbGetKey();
//            printf("cs007,");
            RET_FILL(EPP_MAC_CHECK_ERROR)
        }
        Epp_MultiDes(&g_EppRecvBuff[5], 3, &g_EppSendBuff[200], abyTek, 24, EPP_TDEA_DECRYPT);
        if (0 != g_EppSendBuff[203])
        {//lcdPrintf("cs006=%d,", g_EppSendBuff[200]); kbGetKey();
//            printf("cs006,");
            RET_FILL(RET_ERROR_BASE+g_EppSendBuff[203])
        }
        if (0 == g_EppSendBuff[212])
        {//lcdPrintf("cs005   "); kbGetKey();
//            printf("cs005,");
            RET_FILL(EPP_NO_PIN)
        }
        memcpy(pbyPinBlockOut, &g_EppSendBuff[204], 8);
        memcpy(&pbyPinBlockOut[8], &g_EppSendBuff[213], 10);
    }
    else
    {
        if (27 != wRecvLen)
        {//lcdPrintf("cs004   "); kbGetKey();
//            printf("cs004,");
            RET_FILL(EPP_RECV_LEN_ERROR)
        }
        Epp_ComputeMac(&g_EppRecvBuff[5], 16, &abyTek[24], 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[200]);
        if (0 != memcmp(&g_EppSendBuff[200],&g_EppRecvBuff[21],4))
        {//lcdPrintf("cs003   "); kbGetKey();
//            printf("cs003,");
            RET_FILL(EPP_MAC_CHECK_ERROR)
        }
//	printf("Eppstart\n");
//	for(i = 0; i < 8; i++)
//		printf("%02x ", *(g_EppRecvBuff + 9 + i));
//	printf("\n");
//	printf("Eppend\n");
        Epp_MultiDes(&g_EppRecvBuff[5], 2, &g_EppSendBuff[200], abyTek, 24, EPP_TDEA_DECRYPT);
        if (0 != g_EppSendBuff[203])
        {//lcdPrintf("cs002=%d,   ", g_EppSendBuff[200]); kbGetKey();
//            printf("cs002,");
            RET_FILL(RET_ERROR_BASE+g_EppSendBuff[203])
        }
        if (0 == g_EppSendBuff[212])
        {//lcdPrintf("cs001   "); kbGetKey();
//            printf("cs001,");
            RET_FILL(EPP_NO_PIN)
        }
        memcpy(pbyPinBlockOut, &g_EppSendBuff[204], 8);
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_get_tdea(EPP_CONFIGURE *cfg, uint32_t Mode, uint32_t KeyType, uint32_t KeyIndex,
				 const void *pbyDataIn, size_t DataLen,  void *pDataOut)
  描述       :  TDEA运算API
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t Mode ：算法模式
                                0x0000: ECB模式解密运算
                                0x0001: ECB模式加密运算
                                0x0100: CBC模式解密运算
                                0x0101: CBC模式加密运算
                3、uint32_t KeyType ：密钥类型。
                                0x01：主密钥；
                                0x02：MAC密钥；
                                0x03：PIN密钥；
                                0x04：DUKPT MAC密钥；暂不支持
                                0x05：DUKPT PIN密钥；暂不支持
                                0x10：Fixed MAC密钥；
                                0x11：Fixed PIN密钥；  
                4、uint32_t KeyIndex ：密钥索引，可取值[1,100]
                5、const void *pDataIn ：参与运算的数据
                6、size_t DataLen ：数据长度，必须是8的整数倍，最小值为8，最大值为96
  输出参数   :  1、void *pDataOut ：运算结果
  返回值     :  EPP_SUCCESS/EPP_SEND_CMD_ERROR/EPP_RECV_CMD_ERROR/EPP_RECV_RET_ERROR/
                EPP_RECV_LEN_ERROR/EPP_AUTHEN_FAILED/
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-11  V1.0         创建
****************************************************************************/
int epp_get_tdea(EPP_CONFIGURE *cfg, uint32_t Mode, uint32_t KeyType, uint32_t KeyIndex,
				 const void *pDataIn, size_t DataLen,  void *pDataOut)
{
    int iRet;
    BYTE abyRand[10], abyTek[64];
    WORD wRecvLen;

    if (   (KEY_TYPE_MAC!=KeyType)       && (KEY_TYPE_PIN!=KeyType) 
        && (KEY_TYPE_FIXED_MAC!=KeyType) && (KEY_TYPE_FIXED_PIN!=KeyType) 
//        && (KEY_TYPE_DUKPT_MAC!=KeyType) && (KEY_TYPE_DUKPT_PIN!=KeyType) 
        && (KEY_TYPE_MASTER!=KeyType))
    {
        RET_FILL(EPP_INPUT_CMD_ERROR)
    }
    if ((0==KeyIndex) || (KeyIndex>100))
    {
        RET_FILL(EPP_INPUT_KEY_INDEX_ERROR)
    }

    if ((0!=(DataLen%8)) || (0==DataLen) || (DataLen>96))
    {
        RET_FILL(EPP_INPUT_DATA_LEN_ERROR)
    }

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }

    memset(g_EppSendBuff, 0, 1024);
    memcpy(&g_EppSendBuff[5], cfg->sInitCfg.AppName, 16);
    s_get_rand(&g_EppSendBuff[37]);
    memcpy(abyRand, &g_EppSendBuff[37], 8);
    iRet = s_EppCrc16SendPacket(cfg->fd, 40, CMD_UKEY_AUTH_STEP1);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as121"); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as122"); kbGetKey();
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {//lcdPrintf("as123"); kbGetKey();
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (75 != wRecvLen)
    {//lcdPrintf("as124"); kbGetKey();
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    Epp_TDEA(&g_EppRecvBuff[9], &g_EppSendBuff[20], cfg->sInitCfg.Akuak, 16, EPP_TDEA_DECRYPT);
    if (0 != memcmp(abyRand,&g_EppSendBuff[20],8))
    {//lcdPrintf("as125"); kbGetKey();
        RET_FILL(EPP_AUTHEN_FAILED)
    }
    
	Epp_MultiDes(&g_EppRecvBuff[25], 6, abyTek, cfg->sInitCfg.Mutek, 24, EPP_TDEA_DECRYPT);
	
    Epp_TDEA(&g_EppRecvBuff[17], &g_EppSendBuff[9], cfg->sInitCfg.Akuak, 16, EPP_TDEA_ENCRYPT);
    g_EppSendBuff[5] = 0;
    g_EppSendBuff[6] = 0;
    g_EppSendBuff[7] = RET_MODULE_PED;
    g_EppSendBuff[8] = 0;
    iRet = s_EppCrc16SendPacket(cfg->fd, 12, CMD_UKEY_AUTH_STEP2);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as126"); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as127=%d,", iRet); kbGetKey();
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {//lcdPrintf("as128"); kbGetKey();
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {//lcdPrintf("as129"); kbGetKey();
        RET_FILL(EPP_RECV_LEN_ERROR)
    }

    memset(g_EppRecvBuff, 0, 1024);

    g_EppRecvBuff[0] = KeyType;
    g_EppRecvBuff[1] = Mode>>8;
    g_EppRecvBuff[2] = Mode;
    g_EppRecvBuff[3] = KeyIndex;
    g_EppRecvBuff[4] = 0;
    memcpy(&g_EppRecvBuff[5], pDataIn, DataLen);
//    memset(&g_EppRecvBuff[5+wDataLen], 0x33, 8);
    s_get_rand(&g_EppRecvBuff[5+DataLen]);
    Epp_MultiDes(g_EppRecvBuff, (DataLen+8)/8, &g_EppSendBuff[5], abyTek, 24, EPP_TDEA_ENCRYPT);
    Epp_ComputeMac(&g_EppSendBuff[5], DataLen+8, &abyTek[24], 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[DataLen+13]);

    iRet = s_EppCrc16SendPacket(cfg->fd, DataLen+12, CMD_GET_TDEA);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as12a"); kbGetKey();
        RET_FILL(EPP_SEND_CMD_ERROR)
    }

    memset(g_EppRecvBuff, 0x0, 100);
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 30000);
    if (EPP_SUCCESS != iRet)
    {//lcdPrintf("as12b"); kbGetKey();
        return iRet;
    }

    Epp_ComputeMac(&g_EppRecvBuff[5], wRecvLen-11, &abyTek[24], 24, EPP_TDEA_ENCRYPT, &g_EppSendBuff[200]);
    if (0 != memcmp(&g_EppSendBuff[200],&g_EppRecvBuff[wRecvLen-6],4))
    {//lcdPrintf("as12d"); kbGetKey();
        RET_FILL(EPP_MAC_CHECK_ERROR)
    }
    Epp_MultiDes(&g_EppRecvBuff[5], (wRecvLen-11)/8, &g_EppSendBuff[200], abyTek, 24, EPP_TDEA_DECRYPT);
    if (0 != g_EppSendBuff[203])
    {//lcdPrintf("as12e=%02x, %d,",g_EppSendBuff[203], wRecvLen); kbGetKey();
        RET_FILL(RET_ERROR_BASE+g_EppSendBuff[203])
    }
    memcpy(pDataOut, &g_EppSendBuff[204], DataLen);
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_set_pin_input_timeout(EPP_CONFIGURE *cfg, ulong TimeoutMs)
  描述       :  设置PIN输入超时时间长度。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、ulong TimeoutMs ：超时时间，单位是ms。
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_set_pin_input_timeout(EPP_CONFIGURE *cfg, unsigned long TimeoutMs)
{
    int iRet;
    WORD wRecvLen;
    
    if (TimeoutMs > 120000)
    {
        RET_FILL(EPP_INPUT_PARAM_ERROR)
    }

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }


    TimeoutMs /= 100;
    g_EppSendBuff[5] = (BYTE)(TimeoutMs>>8);
    g_EppSendBuff[6] = (BYTE)(TimeoutMs);

    iRet = s_EppCrc16SendPacket(cfg->fd, 2, CMD_SET_PIN_TIMEOUT);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 1000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_set_tdes_iv(EPP_CONFIGURE *cfg, const void *pIvData)
  描述       :  设置Tdes初始向量，该向量只对CBC算法有效
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、const void *pIvData ：8字节的输入向量。
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_set_tdes_iv(EPP_CONFIGURE *cfg, const void *pIvData)
{
    int iRet;
    WORD wRecvLen;
    
    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    memcpy(&g_EppSendBuff[5], pIvData, 8);
    iRet = s_EppCrc16SendPacket(cfg->fd, 8, CMD_SET_TDES_IV);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 1000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}


/****************************************************************************
  函数名     :  int epp_get_rand(EPP_CONFIGURE *cfg, void *pRandBuf, size_t size)
  描述       :  获取随机数
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、size_t size ：缓冲大小
  输出参数   :  1、void *pRandBuf ：存储随机数的数据缓冲，8字节
  返回值     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_INPUT_PARAM_ERROR
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_get_rand(EPP_CONFIGURE *cfg, void *pRandBuf, size_t size)
{
    int iRet;
    WORD wRecvLen;

    if (NULL == pRandBuf)
    {
        RET_FILL(EPP_INPUT_PARAM_ERROR)
    }
    
    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    
    iRet = s_EppCrc16SendPacket(cfg->fd, 0, CMD_GET_RANDOM_NUMBER);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (19 != wRecvLen)
    {
        RET_FILL(EPP_RECV_RET_ERROR)
    }
    if (size >= 8)
    {
        memcpy(pRandBuf, &g_EppRecvBuff[9], 8);
    }
    else if (size > 0)
    {
        memcpy(pRandBuf, &g_EppRecvBuff[9], size);
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_clear_key(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex)
  描述       :  清除当前应用的一个密钥。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t KeyType ：密钥类型
                          0x01：主密钥；
                          0x02：MAC密钥；
                          0x03：PIN密钥；
                          0x10：Fixed MAC密钥；
                          0x11：Fixed PIN密钥；
                3、uint32_t KeyIndex ：密钥索引，如果是Master、MAC、PIN、Fixed MAC或者Fixed 
                          PIN可取值[1,100]，如果是DUKPT密钥则该参数无意义。
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_clear_key(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex)
{
    int iRet;
    WORD wRecvLen;
    
    if (   (KEY_TYPE_MAC!=KeyType)       && (KEY_TYPE_PIN!=KeyType) 
        && (KEY_TYPE_FIXED_MAC!=KeyType) && (KEY_TYPE_FIXED_PIN!=KeyType) 
//        && (KEY_TYPE_DUKPT_MAC!=KeyType) && (KEY_TYPE_DUKPT_PIN!=KeyType) 
        && (KEY_TYPE_MASTER!=KeyType))
    {
        RET_FILL(EPP_INPUT_CMD_ERROR)
    }
    if ((KeyIndex>KEY_INDEX_NUMBER)||(0==KeyIndex))
    {
        RET_FILL(EPP_KEY_INDEX_ERROR)
    }
    
    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    
    memset(g_EppSendBuff, 0, 1024);
    cfg->sInitCfg.AppName[31] = 0;
    strcpy((char*)(&g_EppSendBuff[5]), (char*)cfg->sInitCfg.AppName);
    switch (KeyType)
    {
    case KEY_TYPE_MAC:
        g_EppSendBuff[37] = 1;
        break;
    case KEY_TYPE_PIN:
        g_EppSendBuff[37] = 2;
        break;
    case KEY_TYPE_FIXED_MAC:
        g_EppSendBuff[37] = 3;
        break;
    case KEY_TYPE_FIXED_PIN:
        g_EppSendBuff[37] = 4;
        break;
    case KEY_TYPE_MASTER:
        g_EppSendBuff[37] = 0;
        break;
    }
    g_EppSendBuff[38] = KeyIndex;

    iRet = s_EppCrc16SendPacket(cfg->fd, 34, CMD_CLEAR_ONE_KEY);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 1000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}


/****************************************************************************
  函数名     :  int epp_clear_appkey(EPP_CONFIGURE *cfg)
  描述       :  清除当前应用的所有密钥。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_clear_appkey(EPP_CONFIGURE *cfg)
{
    int iRet;
    WORD wRecvLen;
    
    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    memset(g_EppSendBuff, 0, 1024);
    cfg->sInitCfg.AppName[31] = 0;
    strcpy((char*)(&g_EppSendBuff[5]), (char*)cfg->sInitCfg.AppName);
//    memcpy(&g_EppSendBuff[37], g_abySecuryPassword, 8);

    iRet = s_EppCrc16SendPacket(cfg->fd, 32, CMD_CLEAR_ALL_ONE_KEY);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 10000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_format_ped(EPP_CONFIGURE *cfg)
  描述       :  初始化（格式化）密码键盘，该操作会使EPP清除所有密钥，并恢复使用默认值。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_format_ped(EPP_CONFIGURE *cfg)
{
    int iRet;
    WORD wRecvLen;
        
    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    iRet = s_EppCrc16SendPacket(cfg->fd, 0, CMD_FORMAT_PED);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 20000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_set_idle_logo(EPP_CONFIGURE *cfg, const void *pBmpIdleLogoIn)
  描述       :  更新IDLE LOGO。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、void *pBmpIdleLogoIn  ：单色BMP文件的数据内容。
                               如果是N20，则分辨率必须是122*32。
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_set_idle_logo(EPP_CONFIGURE *cfg, const void *pBmpIdleLogoIn)
{
    int iRet;
    WORD wRecvLen;
    
    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    if (0 != memcmp(pBmpIdleLogoIn,g_abyIdleLogoFileHead,62))
    {
        RET_FILL(EPP_BMP_ERROR)
    }

    memcpy(&g_EppSendBuff[5], pBmpIdleLogoIn, 574);

    iRet = s_EppCrc16SendPacket(cfg->fd, 574, CMD_LOAD_IDLE_LOGO);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 1000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_resume_default_idle_logo(EPP_CONFIGURE *cfg)
  描述       :  回复出厂默认的IDLE LOGO。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_resume_default_idle_logo(EPP_CONFIGURE *cfg)
{
    int iRet;
    WORD wRecvLen;
    
    g_EppSendBuff[5] = 0x3e;

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }

    iRet = s_EppCrc16SendPacket(cfg->fd, 1, CMD_RESTORE_IDLE_LOGO);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 1000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_display_logo(EPP_CONFIGURE *cfg, uint32_t X, uint32_t Y, const void *pBmpLogoIn)
  描述       :  显示BMP单色图片，最大支持122*32
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t X ：显示起始列（像素）
                3、uint32_t Y ：显示起始行（像素）
                4、void *pBmpLogoIn ：单色BMP文件的数据内容。
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_display_logo(EPP_CONFIGURE *cfg, uint32_t X, uint32_t Y, const void *pBmpLogoIn)
{
    int iRet;
    WORD wRecvLen, wSendLength;
    BYTE abyBuff[64], *pbyBmpLogoIn;

    pbyBmpLogoIn = (BYTE*)pBmpLogoIn;
    memcpy(abyBuff, pbyBmpLogoIn, 62);
    wSendLength = abyBuff[3];
    wSendLength <<= 8;
    wSendLength += abyBuff[2];
    abyBuff[2] = 0;
    abyBuff[3] = 0;
    if (wSendLength > 574)
    {
        RET_FILL(EPP_BMP_ERROR)
    }
    if ((0==abyBuff[18])||(abyBuff[18]>122))
    {
        RET_FILL(EPP_BMP_ERROR)
    }
    abyBuff[18] = 0;
    if ((8!=abyBuff[22])&&(16!=abyBuff[22])&&(24!=abyBuff[22])&&(32!=abyBuff[22]))
    {
        RET_FILL(EPP_BMP_ERROR)
    }
    abyBuff[22] = 0;
    
    wRecvLen = pbyBmpLogoIn[35];
    wRecvLen <<= 8;
    wRecvLen += pbyBmpLogoIn[34];
    if (wRecvLen > 512)
    {
        RET_FILL(EPP_BMP_ERROR)
    }
    abyBuff[34] = 0;
    abyBuff[35] = 0;
    if (0 != memcmp(abyBuff,g_abyNormalLogoFileHead,62))
    {
        RET_FILL(EPP_BMP_ERROR)
    }
    
    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    g_EppSendBuff[5] = (BYTE)(X>>8);
    g_EppSendBuff[6] = (BYTE)(X);
    g_EppSendBuff[7] = (BYTE)(Y>>8);
    g_EppSendBuff[8] = (BYTE)(Y);
    memcpy(&g_EppSendBuff[9], pbyBmpLogoIn, wSendLength);

    iRet = s_EppCrc16SendPacket(cfg->fd, wSendLength+4, CMD_DISPLAY_LOGO);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 1000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_display_string(EPP_CONFIGURE *cfg, uint32_t X, uint32_t Y, 
                     uint32_t iMode, const void *str, uint32_t iStrLen)
  描述       :  在屏幕上显示字符串，目前n20只能显示ASCII字符
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t X ：显示位置x
                3、uint32_t Y ：显示位置y
                4、uint32_t iMode ：显示字符的大小8:6x8;16:8x16
                5、const void *str ：显示的字符串
                6、uint32_t iStrLen ：字符串的长度
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_display_string(EPP_CONFIGURE *cfg, uint32_t X, uint32_t Y, 
                     uint32_t iMode, const void *str, uint32_t iStrLen)
{
    int iRet;
    WORD wRecvLen;

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }

    if (NULL == str)
    {
        RET_FILL(EPP_INPUT_PARAM_ERROR)
    }
    g_EppSendBuff[5] = (BYTE)(X>>8);
    g_EppSendBuff[6] = (BYTE)X;
    g_EppSendBuff[7] = (BYTE)(Y>>8);
    g_EppSendBuff[8] = (BYTE)Y;
    g_EppSendBuff[9] = (BYTE)(iMode>>8);
    g_EppSendBuff[10] = (BYTE)iMode;
    memcpy(&g_EppSendBuff[11], str, iStrLen);
    
    iRet = s_EppCrc16SendPacket(cfg->fd, 6+iStrLen, CMD_DISPLAY_STRING);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_RET_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_clear_screen(EPP_CONFIGURE *cfg)
  描述       :  清除屏幕显示。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_clear_screen(EPP_CONFIGURE *cfg)
{
    int iRet;
    WORD wRecvLen;

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }

    iRet = s_EppCrc16SendPacket(cfg->fd, 0, CMD_CLEAR_SCREEN);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 3000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_RET_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

int epp_enter_factory_test(EPP_CONFIGURE *cfg, BYTE bySpeed)
{
    int iRet;
    
    g_EppSendBuff[5] = bySpeed;
    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    memcpy(&g_EppSendBuff[6], "\xab\x87\x98\x56\xcf\xde\xa3\x19", 8);

    iRet = s_EppCrc16SendPacket(cfg->fd, 9, CMD_ENTER_FACTORY_TEST);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_get_system_info(EPP_CONFIGURE *cfg, uint32_t Type, void *pvInfoOut)
  描述       :  获取EPP信息。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t Type ：查询类别；
                          0x00硬件版本；
                          0x01硬件配置； 
                          0x02 机器序列号；
                          0x03 CPU SN；
                          0x10 boot版本；
                          0x11 Kernel版本；
                          0x20 查询协议版本；
                
  输出参数   :  1、void *pvInfoOut ：密码键盘返回的内容，缓冲至少17个字节。
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_get_system_info(EPP_CONFIGURE *cfg, uint32_t Type, void *pvInfoOut)
{
    int iRet;
    WORD wRecvLen;
    
    g_EppSendBuff[5] = Type;

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }

    iRet = s_EppCrc16SendPacket(cfg->fd, 1, CMD_GET_SYSTEM_INFO);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 1000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (27 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    memcpy(pvInfoOut, &g_EppRecvBuff[9], 16);
    memset(pvInfoOut+16, 0, 1);
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_beep(EPP_CONFIGURE *cfg, uint32_t Frequency, uint32_t TimeMs)
  描述       :  Epp蜂鸣器控制
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t Frequency ：频率
                3、uint32_t TimeMs ：时间
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-11  V1.0         创建
****************************************************************************/
int epp_beep(EPP_CONFIGURE *cfg, uint32_t Frequency, uint32_t TimeMs)
{
    int iRet;
    WORD wRecvLen;
    
    g_EppSendBuff[5]  = (BYTE)(Frequency>>24);
    g_EppSendBuff[6]  = (BYTE)(Frequency>>16);
    g_EppSendBuff[7]  = (BYTE)(Frequency>>8);
    g_EppSendBuff[8]  = (BYTE) Frequency;
    g_EppSendBuff[9]  = (BYTE)(TimeMs>>24);
    g_EppSendBuff[10] = (BYTE)(TimeMs>>16);
    g_EppSendBuff[11] = (BYTE)(TimeMs>>8);
    g_EppSendBuff[12] = (BYTE) TimeMs;

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }


    iRet = s_EppCrc16SendPacket(cfg->fd, 8, CMD_BEEP);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 1000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int epp_light(EPP_CONFIGURE *cfg, int TimeMs)
  描述       :  Epp背光控制
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、int TimeMs ：
                              <0:一直亮；
                              =0:一直灭；
                              >0:按指定的时间亮
                              该参数只有在模式1的时候才有效。   
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-11  V1.0         创建
****************************************************************************/
int epp_light(EPP_CONFIGURE *cfg, int TimeMs)
{
    int iRet;
    WORD wRecvLen;

    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }

    memset(&g_EppSendBuff[5], 0, 16);

    if (TimeMs < 0)
    {
        g_EppSendBuff[8]  = 2;
    }
    else if (0 == TimeMs)
    {
        g_EppSendBuff[8]  = 3;
    }
    else
    {
        g_EppSendBuff[8]  = 1;
        g_EppSendBuff[9]  = (BYTE)(TimeMs>>24);
        g_EppSendBuff[10] = (BYTE)(TimeMs>>16);
        g_EppSendBuff[11] = (BYTE)(TimeMs>>8);
        g_EppSendBuff[12] = (BYTE) TimeMs;
    }
    iRet = s_EppCrc16SendPacket(cfg->fd, 8, CMD_LIGHT);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 1000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (11 != wRecvLen)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    RET_FILL(EPP_SUCCESS)
}


/****************************************************************************
  函数名     :  int epp_kb_get_string(EPP_CONFIGURE *cfg, uint32_t iMode, uint32_t iMinLen, 
                   uint32_t iMaxlen, uint32_t iTimeOutMs, void *strBuff)
  描述       :  获取密码键盘上的用户按键输入
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t iMode ：模式
                        D31 rev
                        …  rev
                        D9  rev
                        D8  1（0） 是（否）允许左对齐输入换行显示
                        D7  1（0） 是（否）StrBuf预设内容有效
                        D6  1（0） 大（小）字体
                        D5  1（0） 能（否）输数字
                        D4  1（0） 能（否）输字符
                        D3  1（0） 是（否）密码方式
                        D2  1（0） 左（右）对齐输入
                        D1  1（0） 有（否）小数点
                        D0  1（0） 正（反）显示
                3、uint32_t iMinLen ：最小长度
                4、uint32_t iMaxLen ：最大长度
                5、uint32_t iTimeOutMs ：超时时间
  输出参数   :  1、void *strBuff ：密码键盘返回的内容，缓冲由最大长度决定。
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_kb_get_string(EPP_CONFIGURE *cfg, uint32_t iMode, uint32_t iMinLen, 
                   uint32_t iMaxlen, uint32_t iTimeOutMs, void *strBuff)
{
    int iRet, iLen;
    WORD wRecvLen;
    
    if (0 != s_check_configure(cfg))
    {
        RET_FILL(EPP_CFG_ERROR)
    }
    
    g_EppSendBuff[5]  = (BYTE)(iMode>>24);
    g_EppSendBuff[6]  = (BYTE)(iMode>>16);
    g_EppSendBuff[7]  = (BYTE)(iMode>>8);
    g_EppSendBuff[8]  = (BYTE) iMode;
    g_EppSendBuff[9]  = (BYTE)(iMinLen>>24);
    g_EppSendBuff[10] = (BYTE)(iMinLen>>16);
    g_EppSendBuff[11] = (BYTE)(iMinLen>>8);
    g_EppSendBuff[12] = (BYTE) iMinLen;
    g_EppSendBuff[13] = (BYTE)(iMaxlen>>24);
    g_EppSendBuff[14] = (BYTE)(iMaxlen>>16);
    g_EppSendBuff[15] = (BYTE)(iMaxlen>>8);
    g_EppSendBuff[16] = (BYTE) iMaxlen;
    g_EppSendBuff[17] = (BYTE)(iTimeOutMs>>24);
    g_EppSendBuff[18] = (BYTE)(iTimeOutMs>>16);
    g_EppSendBuff[19] = (BYTE)(iTimeOutMs>>8);
    g_EppSendBuff[20] = (BYTE) iTimeOutMs;
    iLen = strlen((char*)strBuff);
    memcpy(&g_EppSendBuff[21], strBuff, iLen);

    iRet = s_EppCrc16SendPacket(cfg->fd, 16+iLen, CMD_KB_GET_STRING);
    if (EPP_SUCCESS != iRet)
    {
        RET_FILL(EPP_SEND_CMD_ERROR)
    }
    iRet = s_EppCrc16RecvPacket(cfg->fd, g_EppRecvBuff, &wRecvLen, 300000);
    if (EPP_SUCCESS != iRet)
    {
        return iRet;
    }
    if (0 != g_EppRecvBuff[8])
    {
        RET_FILL(RET_ERROR_BASE+g_EppRecvBuff[8])
    }
    if (wRecvLen < 11)
    {
        RET_FILL(EPP_RECV_LEN_ERROR)
    }
    g_EppRecvBuff[wRecvLen-2] = 0;
    strcpy(strBuff, (char*)&g_EppRecvBuff[9]);
    RET_FILL(EPP_SUCCESS)
}

/****************************************************************************
  函数名     :  int BootReadString(BYTE *pbyRecvData, WORD *pwPacketLen, DWORD dwTimeoutMs)
  描述       :  数据包接收函数，遇到0x3e则停止接收
  输入参数   :  1、WORD *pwPacketLen：期望接收数据的长度，如果填0则表示接收到0x3e则停止接收，
                        如果填入非0，则表示按指定的长度接收数据，直至超时。
                2、DWORD dwTimeoutMs：接收超时时间，时间单位是毫秒
  输出参数   :  1、BYTE *pbyRecvData：接收到的所有数据，包括包头和校验，传入
                   的pbyRecvData指向的内存不得小??256字节
                2、WORD *pwPacketLen：实际接收到的所有数据的长度
  返回值     :  SUCCESS：接收成功 / CRC_CHECK_ERROR：数据包CRC校验错误
                / PACKET_LEN_ERROR：数据包长度错误 / RECV_TIMEOUT：超时（超时也有数据）
                / RECV_PACKET_ERROR：接收错误 
  修改历史   :  
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-04-23  V1.0         创建
****************************************************************************/
int s_BootReadString(int fd, BYTE *pbyRecvData, WORD *pwPacketLen, DWORD dwTimeoutMs)
{
    int iRet;
    WORD wRecvLen = 0;

    time_t timep1, timep2;
    DWORD dwTimeSec;

    dwTimeSec = dwTimeoutMs/1000;
    if (dwTimeSec < 2)
    {
        dwTimeSec = 2;
    }
    time(&timep1);

    *pwPacketLen = 0;
    while (1)
    {
        time(&timep2);
        if ((timep2-timep1) > dwTimeSec)
        {
            *pwPacketLen = wRecvLen;
            RET_FILL(EPP_RECV_TIMEOUT)
        }
        iRet = s_EppRecv(fd, &pbyRecvData[wRecvLen], 3); // timeout = 3ms
        if (0 == iRet)
        {
            if ( ((0x3e==pbyRecvData[wRecvLen])&&(0==*pwPacketLen))
                || ((wRecvLen>=*pwPacketLen)&&(0!=*pwPacketLen)))
            {
                wRecvLen++;
                *pwPacketLen = wRecvLen;
                RET_FILL(EPP_SUCCESS)
            }
            wRecvLen++;
        }
        if (wRecvLen > 300)
        {
            return EPP_PACKET_LEN_TOO_LONG;
        }
    }
}

/****************************************************************************
  函数名     :  int BootReadString(BYTE *pbyRecvData, WORD *pwPacketLen, DWORD dwTimeoutMs)
  描述       :  数据包接收函数，遇到0x3e则停止接收
  输入参数   :  1、WORD wReadLen：期望接收数据的长度。接收完成或者超时退出
                2、DWORD dwTimeoutMs：接收超时时间，时间单位是毫秒
  输出参数   :  1、BYTE *pbyRecvData：接收到的所有数据，包括包头和校验，传入
                   的pbyRecvData指向的内存不得小于256字节
                2、WORD *pwPacketLen：实际接收到的所有数据的长度
  返回值     :  SUCCESS：接收成功 / CRC_CHECK_ERROR：数据包CRC校验错误
                / PACKET_LEN_ERROR：数据包长度错误 / RECV_TIMEOUT：超时（超时也有数据）
                / RECV_PACKET_ERROR：接收错误 
  修改历史   :  
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-04-23  V1.0         创建
****************************************************************************/
int s_BootReadStringLen(int fd, WORD wReadLen, BYTE *pbyRecvData, 
           WORD *pwPacketLen, DWORD dwTimeoutMs)
{
    int iRet;
    WORD wRecvLen = 0;
    time_t timep1, timep2;
    DWORD dwTimeSec;

    dwTimeSec = dwTimeoutMs/1000;
    if (dwTimeSec < 2)
    {
        dwTimeSec = 2;
    }
    time(&timep1);

    *pwPacketLen = 0;
    while (1)
    {
        time(&timep2);
        if ((timep2-timep1) > dwTimeSec)
        {
            *pwPacketLen = wRecvLen;
            RET_FILL(EPP_RECV_TIMEOUT)
        }
        iRet = s_EppRecv(fd, &pbyRecvData[wRecvLen], 0); // timeout = 0ms
        if (0 == iRet)
        {
            wRecvLen++;
            if (wRecvLen >= wReadLen)
            {
                *pwPacketLen = wRecvLen;
                RET_FILL(EPP_SUCCESS)
            }
        }
#ifdef SERIAL_PORT_DEBUG
        else if (0 == iRet)
        {
            printf("%02x", pbyRecvData[0]);
        }
#endif
        if (wRecvLen > 300)
        {
            return EPP_PACKET_LEN_TOO_LONG;
        }
    }
}

int s_SendRecv(int fd, BYTE *pbySend, WORD wSendlen, BYTE *pbyRecv, 
         WORD *pwRecvLen, DWORD dwRecvTimeoutMs)
{
    int iRet;

    if (0 == wSendlen)
    {
        RET_FILL(EPP_SUCCESS)
    }
    iRet = s_EppSends(fd, pbySend, wSendlen);
    
    return s_BootReadString(fd, pbyRecv, pwRecvLen, dwRecvTimeoutMs);
}

int s_SendRecvLen(int fd, BYTE *pbySend, WORD wSendlen, WORD wReadLen, 
        BYTE *pbyRecv, WORD *pwRecvLen, DWORD dwRecvTimeoutMs)
{
    int iRet;

    if (0 == wSendlen)
    {
        return 0;
    }
    iRet = s_EppSends(fd, pbySend, wSendlen);
    
    return s_BootReadStringLen(fd, wReadLen, pbyRecv, pwRecvLen, dwRecvTimeoutMs);
}


int s_CheckSLStatus(int fd)
{
    BYTE abyTemp[24];
	WORD wLen;
	int i, iFlag;

    iFlag = 0;
	for (i=0; i<3; i++)
	{
	    abyTemp[0] = 0x04;
	    if (EPP_SUCCESS == s_SendRecvLen(fd, abyTemp, 1, 3, abyTemp, &wLen, 100))
	    {
	        if (3 == wLen)
        	{
        	    if (0 != (abyTemp[0]&0x10))
    	    	{
			         return 1;
    	    	}
				else
				{
	                return 0;
				}
        	}
	    }
	}
	return 2;
}

int s_SetPedConfig(int fd)
{
    BYTE abyTemp[300];
    WORD wLen;
    
    printf("设置ROMST寄存器.\n");

    abyTemp[0] = 0xf2;
    abyTemp[1] = 0x0d;
    abyTemp[2] = 0xf0;
    abyTemp[3] = 0x00;
    abyTemp[4] = 0x00;
    abyTemp[5] = 0x00;
    if (EPP_SUCCESS != s_SendRecv(fd, abyTemp, 6, abyTemp, &wLen, 1000))
    {
        printf("超时.\n");
        return 1;
    }

    printf("设置SECNT寄存器.\n");
    abyTemp[0] = 0xf2;
    abyTemp[1] = 0x10;
    abyTemp[2] = 0x38;
    abyTemp[3] = 0x0f;
    abyTemp[4] = 0x00;
    abyTemp[5] = 0x00;
    if (EPP_SUCCESS != s_SendRecv(fd, abyTemp, 6, abyTemp, &wLen, 1000))
    {
        printf("超时.\n");
        return 1;
    }

    printf("设置DRSRS寄存器.\n");
    abyTemp[0] = 0xf2;
    abyTemp[1] = 0x03;
    abyTemp[2] = 0x01;
    abyTemp[3] = 0x1e;
    abyTemp[4] = 0x00;
    abyTemp[5] = 0x00;
    if (EPP_SUCCESS != s_SendRecv(fd, abyTemp, 6, abyTemp, &wLen, 1000))
    {
        printf("超时.\n");
        return 1;
    }
    
    printf("设置RTR寄存器.\n");
    abyTemp[0] = 0xf2;
    abyTemp[1] = 0x07;
    abyTemp[2] = 0x50;
    abyTemp[3] = 0x00;
    abyTemp[4] = 0x00;
    abyTemp[5] = 0x00;
    if (EPP_SUCCESS != s_SendRecv(fd, abyTemp, 6, abyTemp, &wLen, 1000))
    {
        printf("超时.\n");
        return 1;
    }
    
    printf("锁定...\n");
    abyTemp[0] = 0xf1;
    if (EPP_SUCCESS != s_SendRecv(fd, abyTemp, 1, abyTemp, &wLen, 1000))
    {
        printf("超时.\n");
        return 1;
    }
    return 0;
}



int epp_unlock_ped(EPP_CONFIGURE *cfg, BYTE *pbyUnlockKey)
{
    BYTE abyTemp[300];
    WORD wLen;
    int iCount;

    if (0 != memcmp(pbyUnlockKey,"\x01\xce\x7b\x73\xe5\xd2\x1a\xf6",8))
    {
        printf("解锁密码不正确... \n");
        return -1;
    }
    printf("PED解锁... \n");

    // Enter debug mode
    iCount = 0;
    while (1)
    {
        abyTemp[0] = 0x0d;
        if (EPP_SUCCESS == s_SendRecv(cfg->fd, abyTemp, 1, abyTemp, &wLen, 500))
        {
            iCount++;
            if (iCount >= 2)
            {
                break ;
            }
        }
    }
    iCount = s_CheckSLStatus(cfg->fd);
    if (1 == iCount)
    {
        printf("SL=1导致不可解锁，请重启设备\n");
        return iCount;
    }
    if (2 == iCount)
    {
        printf("读状态错误\n");
        return iCount;
    }
    iCount = s_SetPedConfig(cfg->fd);
    if (0 != iCount)
    {
        return iCount;
    }

    printf("退出下载模式 \n");
    printf("PED 解锁成功\n");
    return EPP_SUCCESS;
}

