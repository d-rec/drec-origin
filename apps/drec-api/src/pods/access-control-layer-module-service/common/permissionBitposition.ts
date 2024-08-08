import { PermissionString } from '../../../utils/enums';

export class DecimalPermissionValue {
  addedPermissionList: { [key in PermissionString]: boolean } = {
    Read: false,
    Write: false,
    Delete: false,
    Update: false,
  };

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
  binaryFormPermission = '0000';
  decimalFormPermission = 0;

  computePermissions(addedPermissionList: {
    [key in PermissionString]: boolean;
  }): number {
    let binaryFormPermission = '';
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      binaryFormPermission =
        (addedPermissionList[ele.permissionString] === true ? '1' : '0') +
        binaryFormPermission;
    });
    this.binaryFormPermission = binaryFormPermission;

    let decimalFormPermission = 0;
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      decimalFormPermission =
        decimalFormPermission +
        Math.pow(2, ele.bitPosition - 1) *
          (addedPermissionList[ele.permissionString] === true ? 1 : 0);
    });
    this.decimalFormPermission = decimalFormPermission;
    return this.decimalFormPermission;
  }

  checkModulePermissionAgainstUserPermission(
    modulePermission: number,
    userPermission: number,
  ): any {
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      if (
        (ele.andOperationNumber & modulePermission) ===
        ele.andOperationNumber
      ) {
        this.modulePermissions.find(
          (eleMod: any) => eleMod.bitPosition == ele.bitPosition,
        ).isSet = true;
      }
    });
    const getpermission: any = [];
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      if (
        (ele.andOperationNumber & userPermission) ===
        ele.andOperationNumber
      ) {
        if (
          this.modulePermissions.find(
            (eleMod: any) => eleMod.bitPosition == ele.bitPosition,
          ).isSet
        ) {
          this.userPermissions.find(
            (eleMod: any) => eleMod.bitPosition == ele.bitPosition,
          ).isSet = true;
          getpermission.push(ele.permissionString);
        }
      }
    });
    return getpermission;
  }
}
