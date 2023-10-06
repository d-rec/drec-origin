
import { PermissionString } from '../../../utils/enums';

//32 bit permission

export class DecimalPermissionValue {

  // permissionModuleNumber: number = 11;
  // permissionUserTobegiven: number = 6;
  // constructor() {
  //   this.checkModulePermissionAgainstUserPermission(
  //     this.permissionModuleNumber,
  //     this.permissionUserTobegiven
  //   );
  // }

  addedPermissionList: { [key in PermissionString]: boolean } = {
    Read: false,
    Write: false,
    Delete: false,
    Update: false,
  };
  // name = 'u';
  // oddNumbers = [1, 3, 5, 7];
  // evenNumbers = [2, 4, 6, 8];
  // onlyOdd = false;

  // permissionListUI: Array<PermissionString> = [
  //   PermissionString.Read,
  //   PermissionString.Delete,
  //   PermissionString.Write,
  //   PermissionString.Update,
  // ];

  permissionListMAPToBItPOSITIONSAtAPI: Array<{
    permissionString: PermissionString;
    bitPosition: number;
    andOperationNumber: number;
  }> = [
      {
        permissionString: PermissionString.Read,
        bitPosition: 1,
        andOperationNumber: 1,
      },
      {
        permissionString: PermissionString.Write,
        bitPosition: 2,
        andOperationNumber: 2,
      },
      {
        permissionString: PermissionString.Update,
        bitPosition: 3,
        andOperationNumber: 4,
      },
      {
        permissionString: PermissionString.Delete,
        bitPosition: 4,
        andOperationNumber: 8,
      },
    ];
  modulePermissions: any = [
    {
      bitPosition: 1,
      isSet: false,
    },
    {
      bitPosition: 2,
      isSet: false,
    },
    {
      bitPosition: 3,
      isSet: false,
    },
    {
      bitPosition: 4,
      isSet: false,
    },
  ];

  userPermissions: any = [
    {
      bitPosition: 1,
      isSet: false,
    },
    {
      bitPosition: 2,
      isSet: false,
    },
    {
      bitPosition: 3,
      isSet: false,
    },
    {
      bitPosition: 4,
      isSet: false,
    },
  ];
  binaryFormPermission: string = '0000';
  decimalFormPermission: number = 0;

  computePermissions(addedPermissionList: any) {
    //console.log(PermissionString);
    let binaryFormPermission: string = '';
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      //console.log(ele);
      binaryFormPermission =
        (addedPermissionList[ele.permissionString] === true ? '1' : '0') +
        binaryFormPermission;
      //console.log(binaryFormPermission);
    });
    this.binaryFormPermission = binaryFormPermission;

    let decimalFormPermission: number = 0;
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      decimalFormPermission =
        decimalFormPermission +
        Math.pow(2, ele.bitPosition - 1) *
        (addedPermissionList[ele.permissionString] === true ? 1 : 0);
    });
    this.decimalFormPermission = decimalFormPermission;
    //console.log(this.decimalFormPermission)
    return this.decimalFormPermission;
  }

  checkModulePermissionAgainstUserPermission(modulePermission: number, userPermission: number) {
    //console.log(modulePermission);
    //console.log(userPermission);
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      if (
        (ele.andOperationNumber & modulePermission) ===
        ele.andOperationNumber
      ) {

        this.modulePermissions.find(
          (eleMod: any) => eleMod.bitPosition == ele.bitPosition).isSet = true;


      }
    });
    //console.log(this.modulePermissions);
 const getpermission:any=[]
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      if (
        (ele.andOperationNumber & userPermission) ===
        ele.andOperationNumber
      ) {
        if (
          this.modulePermissions.find(
            (eleMod: any) => eleMod.bitPosition == ele.bitPosition
          ).isSet
        ) {
          this.userPermissions.find(
            (eleMod: any) => eleMod.bitPosition == ele.bitPosition
          ).isSet = true;
          getpermission.push(ele.permissionString)
        }
      }
    });
    //console.log("commonpermission");
    //console.log(getpermission);
    //console.log(this.modulePermissions);
    //console.log(this.userPermissions);
    return getpermission;
  }
}
