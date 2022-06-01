
import {PermissionString} from '../../../utils/enums';

//32 bit permission

export class DecimalPermissionValue {
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
  }> = [
    {
      permissionString: PermissionString.Read,
      bitPosition: 1,
    },
    {
      permissionString: PermissionString.Write,
      bitPosition: 2,
    },
    {
      permissionString: PermissionString.Update,
      bitPosition: 3,
    },
    {
      permissionString: PermissionString.Delete,
      bitPosition: 4,
    },
  ];

  binaryFormPermission: string = '0000';
  decimalFormPermission: number = 0;

  computePermissions(addedPermissionList:any) {
    console.log(PermissionString);
    let binaryFormPermission: string = '';
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      console.log(ele);
      binaryFormPermission =
        (addedPermissionList[ele.permissionString] === true ? '1' : '0') +
        binaryFormPermission;
      console.log(binaryFormPermission);
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
    console.log(this.decimalFormPermission)
    return this.decimalFormPermission;
  }
}
