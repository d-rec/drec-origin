import { DeploymentProperties } from "../../types";

export abstract class DeploymentPropertiesRepository {
    public abstract get(): Promise<DeploymentProperties>;
    public abstract save(properties: DeploymentProperties): Promise<void>;
    public abstract propertiesExist(): Promise<boolean>;
}
