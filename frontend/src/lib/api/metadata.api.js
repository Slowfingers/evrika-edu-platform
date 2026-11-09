import {BaseApi} from './base.api.js';
export class MetadataApi extends BaseApi {
 async staticMetadata(key){
  if(!this._metadataRequest)this._metadataRequest=this.fetch('/data/metadata.json').then(async response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();if(!Array.isArray(data.age_groups)||!Array.isArray(data.skills)||!data.formData)throw new Error('Invalid metadata');return data;}).catch(error=>{this._metadataRequest=null;throw error;});
  return {success:true,data:(await this._metadataRequest)[key]};
 }
 getAgeGroups(){return this.useStaticData?this.staticMetadata('age_groups'):this.get('/metadata/age-groups');}
 getSkills(){return this.useStaticData?this.staticMetadata('skills'):this.get('/metadata/skills');}
 getFormData(){return this.useStaticData?this.staticMetadata('formData'):this.get('/metadata/form-data');}
}
export const metadataApi=new MetadataApi();
