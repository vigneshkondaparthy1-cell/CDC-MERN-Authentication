import jwt from 'jsonwebtoken';
export function setSession(res,user){
 const token=jwt.sign({sub:String(user._id),v:user.sessionVersion||0},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:'8h'});
 res.cookie('cdc_token',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:8*60*60*1000});
}
