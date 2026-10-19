import {
  AccountSettings,
  AccountActivity,
  ManageAccount,
  DownloadQr,
  PasswordField,
  generatePassword,
  departments,import StudentCard from './StudentCard';
import {
  AccountSettings,
  AccountActivity,
  ManageAccount,
  DeleteAccount,
  DownloadQr,
  PasswordField,
  generatePassword,
  departments,
  ProfileDetailsEditor,
  ImportStudentsModal,
  NotificationsPanel,
  AttendanceModal,
  FacultyStudentLookup,
  DashboardSummaries
} from './AccountFeatures';
import {CampusObjects} from './Appearance';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  LogOut,
  Plus,
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bell,
  FileSpreadsheet,
  Download,
  Upload,
  UserCheck,
  UserX,
  Calendar,
  CheckCircle,
  Megaphone
} from 'lucide-react';
import './dashboard.css';
import './experience.css';

const initials = name => name ? name.split(' ').map(part => part[0]).slice(0,2).join('') : 'U';

function Shell({user, logout, children, onSection, api}) {
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[active,setActive]=useState('overview');
  const [showNotices,setShowNotices]=useState(false);
  const [unreadCount,setUnreadCount]=useState(0);

  useEffect(()=>{
    let active=true;
    function checkUnread(){
      if(api && document.visibilityState==='visible'){
        api('/campus/overview').then(res=>{
          if(active) setUnreadCount(res.unread || 0);
        }).catch(()=>{});
      }
    }
    checkUnread();
    const timer=setInterval(checkUnread, 20000);
    return ()=>{active=false;clearInterval(timer)};
  },[api]);

  const links=user.role==='admin'
    ?[['overview','Overview'],['faculty','Faculty'],['students','Students'],['activity','Activity'],['help','Help']]
    :[['overview','Overview'],['profile','My profile'],...(user.role==='student'?[['student-qr','My QR']]:[]),['profile-editor','Edit profile'],['settings','Settings'],['help','Help']];

  return (
    <div className="workspace">
      <header className="workspace-header">
        <a href="/" className="brand">
          <span className="brand-symbol"><GraduationCap size={23}/></span>
          <span>CDC<span className="brand-light"> / Portal</span></span>
        </a>

        <div className="header-right">
          {/* Notification Bell */}
          <button
            type="button"
            className="bell-button"
            aria-label={`Campus notifications ${unreadCount ? `(${unreadCount} unread)` : ''}`}
            aria-expanded={showNotices}
            onClick={()=>setShowNotices(v=>!v)}
          >
            <Bell size={18}/>
            {unreadCount > 0 && <span className="bell-pill">{unreadCount}</span>}
          </button>

          {/* User mini portrait */}
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} style={{width:'34px',height:'34px',borderRadius:'10px',objectFit:'cover',border:'1px solid var(--border)'}}/>
          ) : (
            <span className="avatar green" style={{width:'34px',height:'34px',fontSize:'12px',borderRadius:'10px'}}>
              {initials(user.name)}
            </span>
          )}

          <span className="role-pill">{user.role}</span>

          <button
            className="quiet-button"
            disabled={busy}
            onClick={async()=>{
              setError('');setBusy(true);
              try{await logout()}catch(e){setError(e.message)}finally{setBusy(false)}
            }}
          >
            <LogOut size={16}/>{busy?'Signing out…':'Logout'}
          </button>
        </div>
      </header>

      {/* Notifications Drawer */}
      {showNotices && (
        <NotificationsPanel
          api={api}
          user={user}
          onClose={()=>setShowNotices(false)}
          onNoticeAdded={()=>{
            api('/campus/overview').then(res=>setUnreadCount(res.unread||0)).catch(()=>{});
          }}
        />
      )}

      <nav className="workspace-nav" aria-label="Workspace navigation">
        {links.map(([id,label])=>(
          <a
            key={id}
            href={"#"+(["faculty","students"].includes(id)?"directory":id)}
            aria-current={active===id?"location":undefined}
            onClick={()=>{setActive(id);onSection?.(id)}}
          >
            {label}
          </a>
        ))}
      </nav>

      <main id="overview" className="workspace-main">
        {error&&<p role="alert" className="notice error">{error}</p>}
        {children}
        <CampusObjects compact/>
        <details id="help" className="workspace-help">
          <summary>Need a hand?</summary>
          <p>
            {user.role==="admin"
              ?"Use Faculty or Students to browse accounts, filter by department, download formatted Excel spreadsheets, or import students and faculty from CSV."
              :"Your administrator manages key account details. You can update your portrait photo, department, and contact info in Profile Settings."}
          </p>
          {user.role==="student"&&<p>Your QR contains only your unique student identifier. Download or print your student ID card when you need a copy.</p>}
        </details>
      </main>
    </div>
  );
}

function Heading({user,subtitle,action}) {
  return (
    <div className="page-heading enter">
      <div>
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Hello, {user.name.split(' ')[0]}<span className="mint">.</span></h1>
        <p className="subtle">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminDashboard({user,logout,api}) {
  const [tab,setTab]=useState('faculty');
  const [data,setData]=useState({faculty:[],students:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [deptFilter,setDeptFilter]=useState('');
  const [page,setPage]=useState(1);
  const [importModal,setImportModal]=useState(false);
  const [attendanceModal,setAttendanceModal]=useState(false);
  const [notice,setNotice]=useState(null); // { text, role }
  const [revision,setRevision]=useState(0);
  const [management,setManagement]=useState(null);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    async function load(){
      try{
        const [faculty,students]=await Promise.all([api('/admin/faculty'),api('/admin/students')]);
        if(active){
          setData({faculty:faculty.users,students:students.users});
          setError('');
        }
      }catch(e){
        if(active) setError(e.message);
      }finally{
        if(active) setLoading(false);
      }
    }
    load();
    const timer=setInterval(()=>{if(document.visibilityState==='visible')load()},15000);
    return()=>{active=false;clearInterval(timer)};
  },[revision,api]);

  const filtered=useMemo(()=>{
    return data[tab].filter(person=>{
      const matchesQuery=`${person.name} ${person.email} ${person.rollNumber||''} ${person.department||''} ${person.contact||''}`.toLowerCase().includes(query.trim().toLowerCase());
      const matchesDept=!deptFilter || (person.department===deptFilter);
      return matchesQuery && matchesDept;
    }).sort((a,b)=>a.name.localeCompare(b.name));
  },[data,tab,query,deptFilter]);

  const pages=Math.max(1,Math.ceil(filtered.length/8)),currentPage=Math.min(page,pages);

  function selectTab(value){
    setTab(value);
    setQuery('');
    setDeptFilter('');
    setPage(1);
    setNotice(null);
  }

  function downloadExcel(role){
    window.location.href=`/api/admin/export/${role}`;
  }

  async function toggleStatus(person){
    try{
      const newActive = person.active===false ? true : false;
      await api('/admin/accounts/'+person._id+'/status',{
        method:'PATCH',
        body:{active:newActive}
      });
      setNotice({
        text:`Account for ${person.name} has been ${newActive?'reactivated':'deactivated'}.`,
        role:tab
      });
      setRevision(v=>v+1);
    }catch(err){
      setError(err.message);
    }
  }

  return (
    <Shell user={user} logout={logout} onSection={id=>{if(id==="faculty"||id==="students")selectTab(id)}} api={api}>
      <Heading
        user={user}
        subtitle="Campus control center. Students, faculty, and records at your fingertips."
        action={
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
            <button
              type="button"
              className="primary-button"
              onClick={()=>setImportModal('students')}
              title="Import student records from CSV"
            >
              <Upload size={16}/> Import Student CSV
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={()=>setImportModal('faculty')}
              title="Import faculty records from CSV"
            >
              <Upload size={16}/> Import Faculty CSV
            </button>
            
          </div>
        }
      />

      {/* Dashboard Summaries: Deadlines, Attendance, Notices */}
      <DashboardSummaries
        api={api}
        user={user}
        onOpenNotices={()=>{
          const bell=document.querySelector('.bell-button');
          bell?.click();
        }}
        onOpenAttendance={()=>setAttendanceModal(true)}
      />

      {/* Stats Cards */}
      <div className="stats-grid enter">
        <button className={'stat-card '+(tab==='faculty'?'selected':'')} onClick={()=>selectTab('faculty')} aria-label="View faculty">
          <div className="stat-top">
            <span className="stat-icon lavender"><BookOpen size={21}/></span>
            <ArrowUpRight size={20}/>
          </div>
          <strong>{loading?'—':data.faculty.length}</strong>
          <span>Faculty members</span>
          <div className="stat-track"><i style={{width:'100%'}}/></div>
        </button>

        <button className={'stat-card '+(tab==='students'?'selected':'')} onClick={()=>selectTab('students')} aria-label="View students">
          <div className="stat-top">
            <span className="stat-icon green"><GraduationCap size={23}/></span>
            <ArrowUpRight size={20}/>
          </div>
          <strong>{loading?'—':data.students.length}</strong>
          <span>Student accounts</span>
          <div className="stat-track"><i style={{width:'100%'}}/></div>
        </button>

        <div className="welcome-card">
          <span className="orb orb-one"/><span className="orb orb-two"/>
          <ShieldCheck size={26}/>
          <div>
            <p className="eyebrow">ADMIN SPACE</p>
            <h2>Verified.<br/>Connected.</h2>
          </div>
          <p>Export live Excel sheets or manage account status anytime.</p>
        </div>
      </div>

      {/* People Directory */}
      <section id="directory" className="directory enter">
        <div className="directory-heading">
          <div>
            <p className="eyebrow">YOUR COMMUNITY</p>
            <h2>People directory</h2>
          </div>

          <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
            {/* CSV Import Buttons */}
            <button
              type="button"
              className="primary-button"
              title="Import students from CSV spreadsheet"
              onClick={()=>setImportModal('students')}
            >
              <Upload size={15}/> Import Student CSV
            </button>
            <button
              type="button"
              className="primary-button"
              title="Import faculty from CSV spreadsheet"
              onClick={()=>setImportModal('faculty')}
            >
              <Upload size={15}/> Import Faculty CSV
            </button>
            {/* Excel Download Buttons */}
            <button
              type="button"
              className="export-button"
              title="Download Students formatted Excel spreadsheet"
              onClick={()=>downloadExcel('students')}
            >
              <FileSpreadsheet size={15}/> Students Excel (.xlsx)
            </button>
            <button
              type="button"
              className="export-button"
              title="Download Faculty formatted Excel spreadsheet"
              onClick={()=>downloadExcel('faculty')}
            >
              <FileSpreadsheet size={15}/> Faculty Excel (.xlsx)
            </button>
            <button className="icon-button" aria-label="Refresh accounts" disabled={loading} onClick={()=>setRevision(v=>v+1)}>
              <RefreshCw size={18} className={loading?'spinning':''}/>
            </button>
          </div>
        </div>

        {/* Directory Tools: Segmented, Dept Filter, Search */}
        <div className="directory-tools">
          <div className="segmented" aria-label="Account type">
            {[['faculty','Faculty'],['students','Students']].map(([value,label])=>(
              <button key={value} aria-pressed={tab===value} onClick={()=>selectTab(value)}>{label}</button>
            ))}
          </div>

          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
            {/* Filter by Department */}
            <select
              className="dept-select"
              aria-label="Filter by department"
              value={deptFilter}
              onChange={e=>{setDeptFilter(e.target.value);setPage(1)}}
            >
              <option value="">All departments</option>
              {departments.map(d=><option key={d} value={d}>{d}</option>)}
            </select>

            <div className="search-field">
              <Search size={18}/>
              <input aria-label="Search accounts" placeholder="Search people, email, roll…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/>
            </div>
          </div>
        </div>

        {/* Immediate Download Excel Alert on Account Creation */}
        {notice && (
          <div className="notice success" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px'}}>
            <span>{notice.text}</span>
            <button type="button" className="export-button" onClick={()=>downloadExcel(notice.role || tab)}>
              <Download size={15}/> Download Updated {notice.role==='students'?'Students':'Faculty'} Excel
            </button>
          </div>
        )}

        {error ? (
          <p role="alert" className="notice error">{error} <button className="text-button" onClick={()=>setRevision(v=>v+1)}>Retry</button></p>
        ) : loading ? (
          <div className="empty-state" role="status">Loading your community…</div>
        ) : !filtered.length ? (
          <div className="empty-state">{query || deptFilter ? 'No people match your filter.' : 'No accounts yet. Add someone to get started.'}</div>
        ) : (
          <div key={tab+currentPage+query+deptFilter} className="people-list enter">
            {filtered.slice((currentPage-1)*8,currentPage*8).map(person=>(
              <details className="person" key={person._id}>
                <summary>
                  <span className={'avatar '+(tab==='students'?'green':'lavender')} style={{overflow:'hidden'}}>
                    {person.avatar ? (
                      <img src={person.avatar} alt={person.name} className="avatar-img"/>
                    ) : (
                      initials(person.name)
                    )}
                  </span>
                  <span className="person-name">
                    {person.name}
                    <span>{tab==='students'?'Student':'Faculty'} · {person.department || 'General'}</span>
                  </span>
                  <span className="person-email">{person.email}</span>
                  <span className={person.active===false?'badge-inactive':'badge-active'} style={{marginRight:'12px'}}>
                    {person.active===false?'Inactive':'Active'}
                  </span>
                  <span className="person-chevron"><ChevronRight size={18}/></span>
                </summary>

                <div className="person-details">
                  <span>Email <strong>{person.email}</strong></span>
                  {person.rollNumber && <span>Roll number <strong>{person.rollNumber}</strong></span>}
                  <span>Department <strong>{person.department || 'General'}</strong></span>
                  <span>Contact <strong>{person.contact || 'Not provided'}</strong></span>
                  <span>Email Verified <strong>{person.emailVerified ? 'Yes ✓' : 'No ⚠️'}</strong></span>

                  <div className="account-actions">
                    <button type="button" style={{color:"#fda4af"}} onClick={()=>setManagement({person,mode:"delete"})}>Delete account</button>
                    <button type="button" onClick={()=>setManagement({person,mode:"edit"})}>Edit profile</button>
                    <button type="button" onClick={()=>setManagement({person,mode:"reset"})}>Reset password</button>
                    <button
                      type="button"
                      style={{color:person.active===false?'#b9f5d0':'#fda4af'}}
                      onClick={()=>toggleStatus(person)}
                    >
                      {person.active===false ? 'Reactivate account' : 'Deactivate account'}
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}

        <div className="pagination">
          <span>{loading?'Loading…':`${filtered.length} ${tab==='faculty'?'faculty':'students'}${deptFilter?` in ${deptFilter}`:''}`}</span>
          <div>
            <button className="icon-button" aria-label="Previous page" disabled={loading||currentPage===1} onClick={()=>setPage(currentPage-1)}>
              <ChevronLeft size={17}/>
            </button>
            <span>{currentPage} / {pages}</span>
            <button className="icon-button" aria-label="Next page" disabled={loading||currentPage===pages} onClick={()=>setPage(currentPage+1)}>
              <ChevronRight size={17}/>
            </button>
          </div>
        </div>
      </section>

      <AccountActivity api={api} revision={revision}/>

      {management && management.mode!=="delete" && (
        <ManageAccount
          person={management.person}
          mode={management.mode}
          api={api}
          onClose={()=>setManagement(null)}
          onSaved={()=>{
            setRevision(v=>v+1);
            setNotice({text:'Account updated successfully.',role:tab});
          }}
        />
      )}

      {management?.mode==="delete" && <DeleteAccount person={management.person} api={api} onClose={()=>setManagement(null)} onDeleted={()=>{setManagement(null);setRevision(v=>v+1);setNotice({text:"Account deleted.",role:tab})}}/> }

      {importModal && (
        <ImportStudentsModal
          type={importModal}
          api={api}
          onClose={()=>setImportModal(false)}
          onImported={(count, importedRole)=>{
            const role = importedRole || (importModal === 'faculty' ? 'faculty' : 'students');
            setNotice({
              text:`Successfully imported ${count} ${role}.`,
              role
            });
            setRevision(v=>v+1);
          }}
        />
      )}

      {attendanceModal && (
        <AttendanceModal
          api={api}
          onClose={()=>setAttendanceModal(false)}
          onSaved={()=>setRevision(v=>v+1)}
        />
      )}
    </Shell>
  );
}

export function ProfileDashboard({user,logout,student=false,api,onUserUpdated}) {
  const [copied,setCopied]=useState(false),[error,setError]=useState('');
  const qrRef=useRef(null);
  const timer=useRef();
  const [attendanceModal,setAttendanceModal]=useState(false);
  const [selectedStudentId,setSelectedStudentId]=useState('');

  useEffect(()=>()=>clearTimeout(timer.current),[]);

  async function copyId(){
    try{
      await navigator.clipboard.writeText(user.studentQrId);
      setCopied(true);setError('');
      clearTimeout(timer.current);
      timer.current=setTimeout(()=>setCopied(false),2000);
    }catch{
      setError('Copy unavailable. Open identifier details to select the ID.');
    }
  }

  return (
    <Shell user={user} logout={logout} api={api}>
      <Heading user={user} subtitle="Your campus identity, attendance, and deadlines at a glance."/>

      {/* Dashboard Summaries: Deadlines, Attendance %, Notices */}
      <DashboardSummaries
        api={api}
        user={user}
        onOpenNotices={()=>{
          const bell=document.querySelector('.bell-button');
          bell?.click();
        }}
        onOpenAttendance={()=>setAttendanceModal(true)}
      />

      <div className="profile-grid enter">
        <section id="profile" className="profile-card">
          <div className="profile-cover">
            <span className="profile-cover-label">CDC / {student?'STUDENT':'FACULTY'}</span>
            <span className="cover-ring"/>
          </div>

          <div className="profile-content">
            <div className="profile-avatar" style={{overflow:'hidden',padding:0}}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar-img"/>
              ) : (
                initials(user.name)
              )}
            </div>

            <span className="role-pill">{user.role}</span>
            <h2>My profile</h2>

            <dl>
              <div><dt>Full name</dt><dd>{user.name}</dd></div>
              <div><dt>Email</dt><dd>{user.email}</dd></div>
              <div><dt>Department</dt><dd>{user.department || 'Not configured yet'}</dd></div>
              <div><dt>Contact details</dt><dd>{user.contact || 'Not configured yet'}</dd></div>
              {student && <div><dt>Roll number</dt><dd>{user.rollNumber}</dd></div>}
              <div><dt>Role</dt><dd className="capitalize">{user.role}</dd></div>
              <div>
                <dt>Verification Status</dt>
                <dd>
                  <span className={user.emailVerified?'badge-verified':'badge-unverified'}>
                    {user.emailVerified?'Verified ✓':'Unverified ⚠️'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {student ? (
          <StudentCard user={user}/>
        ) : (
          <aside className="faculty-note">
            <BookOpen size={34}/>
            <p className="eyebrow">FACULTY WORKSPACE</p>
            <h2>A space<br/>that’s yours.</h2>
            <p className="subtle">Your profile, deadlines, and department records within reach.</p>
            <span className="decor-line"/>
          </aside>
        )}
      </div>

      {/* Fast Roll Number Search & Attendance for Faculty */}
      {!student && (
        <FacultyStudentLookup
          api={api}
          onSelectStudent={(sId)=>{
            setSelectedStudentId(sId);
            setAttendanceModal(true);
          }}
        />
      )}

      {/* Profile Photo & Department/Contact details update */}
      <ProfileDetailsEditor user={user} api={api} onUserUpdated={onUserUpdated}/>

      {/* Account Password & Email Settings */}
      <AccountSettings user={user} api={api} onUserUpdated={onUserUpdated}/>

      {attendanceModal && (
        <AttendanceModal
          api={api}
          initialStudentId={selectedStudentId}
          onClose={()=>{
            setAttendanceModal(false);
            setSelectedStudentId('');
          }}
        />
      )}
    </Shell>
  );
}

  ProfileDetailsEditor,
  ImportStudentsModal,
  NotificationsPanel,
  AttendanceModal,
  FacultyStudentLookup,
  DashboardSummaries
} from './AccountFeatures';
import {CampusObjects} from './Appearance';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  LogOut,
  Plus,
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bell,
  FileSpreadsheet,
  Upload,
  UserCheck,
  UserX,
  Calendar,
  CheckCircle,
  Megaphone
} from 'lucide-react';
import './dashboard.css';
import './experience.css';

const initials = name => name ? name.split(' ').map(part => part[0]).slice(0,2).join('') : 'U';

function Shell({user, logout, children, onSection, api}) {
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[active,setActive]=useState('overview');
  const [showNotices,setShowNotices]=useState(false);
  const [unreadCount,setUnreadCount]=useState(0);

  useEffect(()=>{
    let active=true;
    function checkUnread(){
      if(api && document.visibilityState==='visible'){
        api('/campus/overview').then(res=>{
          if(active) setUnreadCount(res.unread || 0);
        }).catch(()=>{});
      }
    }
    checkUnread();
    const timer=setInterval(checkUnread, 20000);
    return ()=>{active=false;clearInterval(timer)};
  },[api]);

  const links=user.role==='admin'
    ?[['overview','Overview'],['faculty','Faculty'],['students','Students'],['activity','Activity'],['help','Help']]
    :[['overview','Overview'],['profile','My profile'],...(user.role==='student'?[['student-qr','My QR']]:[]),['profile-editor','Edit profile'],['settings','Settings'],['help','Help']];

  return (
    <div className="workspace">
      <header className="workspace-header">
        <a href="/" className="brand">
          <span className="brand-symbol"><GraduationCap size={23}/></span>
          <span>CDC<span className="brand-light"> / Portal</span></span>
        </a>

        <div className="header-right">
          {/* Notification Bell */}
          <button
            type="button"
            className="bell-button"
            aria-label={`Campus notifications ${unreadCount ? `(${unreadCount} unread)` : ''}`}
            aria-expanded={showNotices}
            onClick={()=>setShowNotices(v=>!v)}
          >
            <Bell size={18}/>
            {unreadCount > 0 && <span className="bell-pill">{unreadCount}</span>}
          </button>

          {/* User mini portrait */}
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} style={{width:'34px',height:'34px',borderRadius:'10px',objectFit:'cover',border:'1px solid var(--border)'}}/>
          ) : (
            <span className="avatar green" style={{width:'34px',height:'34px',fontSize:'12px',borderRadius:'10px'}}>
              {initials(user.name)}
            </span>
          )}

          <span className="role-pill">{user.role}</span>

          <button
            className="quiet-button"
            disabled={busy}
            onClick={async()=>{
              setError('');setBusy(true);
              try{await logout()}catch(e){setError(e.message)}finally{setBusy(false)}
            }}
          >
            <LogOut size={16}/>{busy?'Signing out…':'Logout'}
          </button>
        </div>
      </header>

      {/* Notifications Drawer */}
      {showNotices && (
        <NotificationsPanel
          api={api}
          user={user}
          onClose={()=>setShowNotices(false)}
          onNoticeAdded={()=>{
            api('/campus/overview').then(res=>setUnreadCount(res.unread||0)).catch(()=>{});
          }}
        />
      )}

      <nav className="workspace-nav" aria-label="Workspace navigation">
        {links.map(([id,label])=>(
          <a
            key={id}
            href={"#"+(["faculty","students"].includes(id)?"directory":id)}
            aria-current={active===id?"location":undefined}
            onClick={()=>{setActive(id);onSection?.(id)}}
          >
            {label}
          </a>
        ))}
      </nav>

      <main id="overview" className="workspace-main">
        {error&&<p role="alert" className="notice error">{error}</p>}
        {children}
        <CampusObjects compact/>
        <details id="help" className="workspace-help">
          <summary>Need a hand?</summary>
          <p>
            {user.role==="admin"
              ?"Use Faculty or Students to browse accounts, filter by department, download formatted Excel spreadsheets, or import students and faculty from CSV."
              :"Your administrator manages key account details. You can update your portrait photo, department, and contact info in Profile Settings."}
          </p>
          {user.role==="student"&&<p>Your QR contains only your unique student identifier. Use Copy identifier when you need the code as text.</p>}
        </details>
      </main>
    </div>
  );
}

function Heading({user,subtitle,action}) {
  return (
    <div className="page-heading enter">
      <div>
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Hello, {user.name.split(' ')[0]}<span className="mint">.</span></h1>
        <p className="subtle">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function CreateAccount({type,api,onCreated,onClose}) {
 const dialog=useRef(null),student=type==='students';
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[password,setPassword]=useState(''),[roll,setRoll]=useState(''),[suggesting,setSuggesting]=useState(false);
 const [department,setDepartment]=useState(''),[contact,setContact]=useState('');

 useEffect(()=>{
   dialog.current.showModal();
   let active=true;
   if(student){
     api('/admin/next-roll').then(data=>{
       if(active)setRoll(value=>value||data.rollNumber)
     }).catch(()=>{});
   }
   return()=>{active=false};
 },[student,api]);

 async function suggest(){
   setSuggesting(true);setError('');
   try{
     setRoll((await api('/admin/next-roll')).rollNumber)
   }catch(e){
     setError(e.message)
   }finally{
     setSuggesting(false)
   }
 }

 async function submit(event){
   event.preventDefault();setBusy(true);setError('');
   const body={
     ...Object.fromEntries(new FormData(event.currentTarget)),
     password,
     department,
     contact
   };
   try{
     await api('/admin/'+type,{method:'POST',body});
     onCreated(type);
     onClose();
   }catch(e){
     setError(e.message);
     setBusy(false);
   }
 }

 return (
   <dialog className="account-dialog" ref={dialog} onCancel={event=>{event.preventDefault();if(!busy)onClose()}} aria-labelledby="dialog-title">
     <div className="section-heading">
       <div>
         <p className="eyebrow">NEW ACCOUNT</p>
         <h2 id="dialog-title">Add {student?'student':'faculty'}</h2>
       </div>
       <button className="icon-button" aria-label="Close account form" disabled={busy} onClick={onClose}><X size={20}/></button>
     </div>
     <form onSubmit={submit}>
       <fieldset disabled={busy}>
         <div className="form-field">
           <label htmlFor="create-name">Full name</label>
           <input id="create-name" name="name" required minLength={2} maxLength={100}/>
         </div>

         <div className="form-field">
           <label htmlFor="create-email">Email</label>
           <input id="create-email" name="email" type="email" required/>
         </div>

         <div className="form-field">
           <label htmlFor="create-dept">Department</label>
           <select id="create-dept" className="dept-select" style={{width:'100%',padding:'12px'}} value={department} onChange={e=>setDepartment(e.target.value)}>
             <option value="">Select Department…</option>
             {departments.map(d=><option key={d} value={d}>{d}</option>)}
           </select>
         </div>

         <div className="form-field">
           <label htmlFor="create-contact">Contact number</label>
           <input id="create-contact" value={contact} onChange={e=>setContact(e.target.value)} placeholder="+91 98765 43210"/>
         </div>

         {student && (
           <div className="form-field">
             <label htmlFor="create-rollNumber">Roll number</label>
             <input id="create-rollNumber" name="rollNumber" required pattern="[0-9]{6}" minLength={6} maxLength={6} inputMode="numeric" value={roll} onChange={e=>setRoll(e.target.value)}/>
             <div className="roll-helper">
               <span>Six digits · checked when saved</span>
               <button type="button" className="text-button" disabled={suggesting} onClick={suggest}>
                 {suggesting?'Checking…':'Suggest available'}
               </button>
             </div>
           </div>
         )}

         <PasswordField id="create-password" label="Initial password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8}/>
         <button type="button" className="text-button generator" onClick={()=>setPassword(generatePassword())}>Generate password</button>

         {error&&<p role="alert" className="notice error">{error}</p>}

         <button disabled={busy} className="primary-button submit-button">
           {busy?'Creating…':'Create account'}<ArrowUpRight size={17}/>
         </button>
       </fieldset>
     </form>
   </dialog>
 );
}

export function AdminDashboard({user,logout,api}) {
  const [tab,setTab]=useState('faculty');
  const [data,setData]=useState({faculty:[],students:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [deptFilter,setDeptFilter]=useState('');
  const [page,setPage]=useState(1);
  const [modal,setModal]=useState(null);
  const [importModal,setImportModal]=useState(false);
  const [attendanceModal,setAttendanceModal]=useState(false);
  const [notice,setNotice]=useState(null); // { text, role }
  const [revision,setRevision]=useState(0);
  const [management,setManagement]=useState(null);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    async function load(){
      try{
        const [faculty,students]=await Promise.all([api('/admin/faculty'),api('/admin/students')]);
        if(active){
          setData({faculty:faculty.users,students:students.users});
          setError('');
        }
      }catch(e){
        if(active) setError(e.message);
      }finally{
        if(active) setLoading(false);
      }
    }
    load();
    const timer=setInterval(()=>{if(document.visibilityState==='visible')load()},15000);
    return()=>{active=false;clearInterval(timer)};
  },[revision,api]);

  const filtered=useMemo(()=>{
    return data[tab].filter(person=>{
      const matchesQuery=`${person.name} ${person.email} ${person.rollNumber||''} ${person.department||''} ${person.contact||''}`.toLowerCase().includes(query.trim().toLowerCase());
      const matchesDept=!deptFilter || (person.department===deptFilter);
      return matchesQuery && matchesDept;
    }).sort((a,b)=>a.name.localeCompare(b.name));
  },[data,tab,query,deptFilter]);

  const pages=Math.max(1,Math.ceil(filtered.length/8)),currentPage=Math.min(page,pages);

  function selectTab(value){
    setTab(value);
    setQuery('');
    setDeptFilter('');
    setPage(1);
    setNotice(null);
  }

  function downloadExcel(role){
    window.location.href=`/api/admin/export/${role}`;
  }

  async function toggleStatus(person){
    try{
      const newActive = person.active===false ? true : false;
      await api('/admin/accounts/'+person._id+'/status',{
        method:'PATCH',
        body:{active:newActive}
      });
      setNotice({
        text:`Account for ${person.name} has been ${newActive?'reactivated':'deactivated'}.`,
        role:tab
      });
      setRevision(v=>v+1);
    }catch(err){
      setError(err.message);
    }
  }

  return (
    <Shell user={user} logout={logout} onSection={id=>{if(id==="faculty"||id==="students")selectTab(id)}} api={api}>
      <Heading
        user={user}
        subtitle="Campus control center. Students, faculty, and records at your fingertips."
        action={
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
            <button
              type="button"
              className="secondary-button"
              onClick={()=>setImportModal('students')}
              title="Import student records from CSV"
            >
              <Upload size={16}/> Import Student CSV
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={()=>setImportModal('faculty')}
              title="Import faculty records from CSV"
            >
              <Upload size={16}/> Import Faculty CSV
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={()=>setModal(tab)}
            >
              <Plus size={18}/> Add account
            </button>
          </div>
        }
      />

      {/* Dashboard Summaries: Deadlines, Attendance, Notices */}
      <DashboardSummaries
        api={api}
        user={user}
        onOpenNotices={()=>{
          const bell=document.querySelector('.bell-button');
          bell?.click();
        }}
        onOpenAttendance={()=>setAttendanceModal(true)}
      />

      {/* Stats Cards */}
      <div className="stats-grid enter">
        <button className={'stat-card '+(tab==='faculty'?'selected':'')} onClick={()=>selectTab('faculty')} aria-label="View faculty">
          <div className="stat-top">
            <span className="stat-icon lavender"><BookOpen size={21}/></span>
            <ArrowUpRight size={20}/>
          </div>
          <strong>{loading?'—':data.faculty.length}</strong>
          <span>Faculty members</span>
          <div className="stat-track"><i style={{width:'100%'}}/></div>
        </button>

        <button className={'stat-card '+(tab==='students'?'selected':'')} onClick={()=>selectTab('students')} aria-label="View students">
          <div className="stat-top">
            <span className="stat-icon green"><GraduationCap size={23}/></span>
            <ArrowUpRight size={20}/>
          </div>
          <strong>{loading?'—':data.students.length}</strong>
          <span>Student accounts</span>
          <div className="stat-track"><i style={{width:'100%'}}/></div>
        </button>

        <div className="welcome-card">
          <span className="orb orb-one"/><span className="orb orb-two"/>
          <ShieldCheck size={26}/>
          <div>
            <p className="eyebrow">ADMIN SPACE</p>
            <h2>Verified.<br/>Connected.</h2>
          </div>
          <p>Export live Excel sheets or manage account status anytime.</p>
        </div>
      </div>

      {/* People Directory */}
      <section id="directory" className="directory enter">
        <div className="directory-heading">
          <div>
            <p className="eyebrow">YOUR COMMUNITY</p>
            <h2>People directory</h2>
          </div>

          <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
            {/* CSV Import Buttons */}
            <button
              type="button"
              className="export-button"
              title="Import students from CSV spreadsheet"
              onClick={()=>setImportModal('students')}
            >
              <Upload size={15}/> Import Student CSV
            </button>
            <button
              type="button"
              className="export-button"
              title="Import faculty from CSV spreadsheet"
              onClick={()=>setImportModal('faculty')}
            >
              <Upload size={15}/> Import Faculty CSV
            </button>
            {/* Excel Download Buttons */}
            <button
              type="button"
              className="export-button"
              title="Download Students formatted Excel spreadsheet"
              onClick={()=>downloadExcel('students')}
            >
              <FileSpreadsheet size={15}/> Students Excel (.xlsx)
            </button>
            <button
              type="button"
              className="export-button"
              title="Download Faculty formatted Excel spreadsheet"
              onClick={()=>downloadExcel('faculty')}
            >
              <FileSpreadsheet size={15}/> Faculty Excel (.xlsx)
            </button>
            <button className="icon-button" aria-label="Refresh accounts" disabled={loading} onClick={()=>setRevision(v=>v+1)}>
              <RefreshCw size={18} className={loading?'spinning':''}/>
            </button>
          </div>
        </div>

        {/* Directory Tools: Segmented, Dept Filter, Search */}
        <div className="directory-tools">
          <div className="segmented" aria-label="Account type">
            {[['faculty','Faculty'],['students','Students']].map(([value,label])=>(
              <button key={value} aria-pressed={tab===value} onClick={()=>selectTab(value)}>{label}</button>
            ))}
          </div>

          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
            {/* Filter by Department */}
            <select
              className="dept-select"
              aria-label="Filter by department"
              value={deptFilter}
              onChange={e=>{setDeptFilter(e.target.value);setPage(1)}}
            >
              <option value="">All departments</option>
              {departments.map(d=><option key={d} value={d}>{d}</option>)}
            </select>

            <div className="search-field">
              <Search size={18}/>
              <input aria-label="Search accounts" placeholder="Search people, email, roll…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/>
            </div>
          </div>
        </div>

        {/* Immediate Download Excel Alert on Account Creation */}
        {notice && (
          <div className="notice success" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px'}}>
            <span>{notice.text}</span>
            <button type="button" className="export-button" onClick={()=>downloadExcel(notice.role || tab)}>
              <Download size={15}/> Download Updated {notice.role==='students'?'Students':'Faculty'} Excel
            </button>
          </div>
        )}

        {error ? (
          <p role="alert" className="notice error">{error} <button className="text-button" onClick={()=>setRevision(v=>v+1)}>Retry</button></p>
        ) : loading ? (
          <div className="empty-state" role="status">Loading your community…</div>
        ) : !filtered.length ? (
          <div className="empty-state">{query || deptFilter ? 'No people match your filter.' : 'No accounts yet. Add someone to get started.'}</div>
        ) : (
          <div key={tab+currentPage+query+deptFilter} className="people-list enter">
            {filtered.slice((currentPage-1)*8,currentPage*8).map(person=>(
              <details className="person" key={person._id}>
                <summary>
                  <span className={'avatar '+(tab==='students'?'green':'lavender')} style={{overflow:'hidden'}}>
                    {person.avatar ? (
                      <img src={person.avatar} alt={person.name} className="avatar-img"/>
                    ) : (
                      initials(person.name)
                    )}
                  </span>
                  <span className="person-name">
                    {person.name}
                    <span>{tab==='students'?'Student':'Faculty'} · {person.department || 'General'}</span>
                  </span>
                  <span className="person-email">{person.email}</span>
                  <span className={person.active===false?'badge-inactive':'badge-active'} style={{marginRight:'12px'}}>
                    {person.active===false?'Inactive':'Active'}
                  </span>
                  <span className="person-chevron"><ChevronRight size={18}/></span>
                </summary>

                <div className="person-details">
                  <span>Email <strong>{person.email}</strong></span>
                  {person.rollNumber && <span>Roll number <strong>{person.rollNumber}</strong></span>}
                  <span>Department <strong>{person.department || 'General'}</strong></span>
                  <span>Contact <strong>{person.contact || 'Not provided'}</strong></span>
                  <span>Email Verified <strong>{person.emailVerified ? 'Yes ✓' : 'No ⚠️'}</strong></span>

                  <div className="account-actions">
                    <button type="button" onClick={()=>setManagement({person,mode:"edit"})}>Edit profile</button>
                    <button type="button" onClick={()=>setManagement({person,mode:"reset"})}>Reset password</button>
                    <button
                      type="button"
                      style={{color:person.active===false?'#b9f5d0':'#fda4af'}}
                      onClick={()=>toggleStatus(person)}
                    >
                      {person.active===false ? 'Reactivate account' : 'Deactivate account'}
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}

        <div className="pagination">
          <span>{loading?'Loading…':`${filtered.length} ${tab==='faculty'?'faculty':'students'}${deptFilter?` in ${deptFilter}`:''}`}</span>
          <div>
            <button className="icon-button" aria-label="Previous page" disabled={loading||currentPage===1} onClick={()=>setPage(currentPage-1)}>
              <ChevronLeft size={17}/>
            </button>
            <span>{currentPage} / {pages}</span>
            <button className="icon-button" aria-label="Next page" disabled={loading||currentPage===pages} onClick={()=>setPage(currentPage+1)}>
              <ChevronRight size={17}/>
            </button>
          </div>
        </div>
      </section>

      <AccountActivity api={api} revision={revision}/>

      {management && (
        <ManageAccount
          person={management.person}
          mode={management.mode}
          api={api}
          onClose={()=>setManagement(null)}
          onSaved={()=>{
            setRevision(v=>v+1);
            setNotice({text:'Account updated successfully.',role:tab});
          }}
        />
      )}

      {modal && (
        <CreateAccount
          type={modal}
          api={api}
          onClose={()=>setModal(null)}
          onCreated={(createdRole)=>{
            setNotice({
              text:`${createdRole==='students'?'Student':'Faculty'} account created successfully.`,
              role:createdRole
            });
            setRevision(v=>v+1);
          }}
        />
      )}

      {importModal && (
        <ImportStudentsModal
          type={importModal}
          api={api}
          onClose={()=>setImportModal(false)}
          onImported={(count, importedRole)=>{
            const role = importedRole || (importModal === 'faculty' ? 'faculty' : 'students');
            setNotice({
              text:`Successfully imported ${count} ${role}.`,
              role
            });
            setRevision(v=>v+1);
          }}
        />
      )}

      {attendanceModal && (
        <AttendanceModal
          api={api}
          onClose={()=>setAttendanceModal(false)}
          onSaved={()=>setRevision(v=>v+1)}
        />
      )}
    </Shell>
  );
}

export function ProfileDashboard({user,logout,student=false,api,onUserUpdated}) {
  const [copied,setCopied]=useState(false),[error,setError]=useState('');
  const qrRef=useRef(null);
  const timer=useRef();
  const [attendanceModal,setAttendanceModal]=useState(false);
  const [selectedStudentId,setSelectedStudentId]=useState('');

  useEffect(()=>()=>clearTimeout(timer.current),[]);

  async function copyId(){
    try{
      await navigator.clipboard.writeText(user.studentQrId);
      setCopied(true);setError('');
      clearTimeout(timer.current);
      timer.current=setTimeout(()=>setCopied(false),2000);
    }catch{
      setError('Copy unavailable. Open identifier details to select the ID.');
    }
  }

  return (
    <Shell user={user} logout={logout} api={api}>
      <Heading user={user} subtitle="Your campus identity, attendance, and deadlines at a glance."/>

      {/* Dashboard Summaries: Deadlines, Attendance %, Notices */}
      <DashboardSummaries
        api={api}
        user={user}
        onOpenNotices={()=>{
          const bell=document.querySelector('.bell-button');
          bell?.click();
        }}
        onOpenAttendance={()=>setAttendanceModal(true)}
      />

      <div className="profile-grid enter">
        <section id="profile" className="profile-card">
          <div className="profile-cover">
            <span className="profile-cover-label">CDC / {student?'STUDENT':'FACULTY'}</span>
            <span className="cover-ring"/>
          </div>

          <div className="profile-content">
            <div className="profile-avatar" style={{overflow:'hidden',padding:0}}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar-img"/>
              ) : (
                initials(user.name)
              )}
            </div>

            <span className="role-pill">{user.role}</span>
            <h2>My profile</h2>

            <dl>
              <div><dt>Full name</dt><dd>{user.name}</dd></div>
              <div><dt>Email</dt><dd>{user.email}</dd></div>
              <div><dt>Department</dt><dd>{user.department || 'Not configured yet'}</dd></div>
              <div><dt>Contact details</dt><dd>{user.contact || 'Not configured yet'}</dd></div>
              {student && <div><dt>Roll number</dt><dd>{user.rollNumber}</dd></div>}
              <div><dt>Role</dt><dd className="capitalize">{user.role}</dd></div>
              <div>
                <dt>Verification Status</dt>
                <dd>
                  <span className={user.emailVerified?'badge-verified':'badge-unverified'}>
                    {user.emailVerified?'Verified ✓':'Unverified ⚠️'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {student ? (
          <section id="student-qr" className="qr-card">
            <p className="eyebrow">YOUR DIGITAL ID</p>
            <h2>My student QR</h2>
            <p className="subtle">One code. Uniquely yours.</p>
            <div className="qr-frame" ref={qrRef}>
              <QRCodeSVG value={user.studentQrId} size={192} level="M" title="Student identifier QR code"/>
            </div>
            <div className="qr-actions">
              <DownloadQr user={user} qrRef={qrRef}/>
              <button className="secondary-button" onClick={copyId}>{copied?'Copied!':'Copy identifier'}</button>
            </div>
            <span role="status" className="sr-only">{copied?'Identifier copied':''}</span>
            {error&&<p role="alert" className="notice error">{error}</p>}
            <details className="identifier-details">
              <summary>Identifier details</summary>
              <p>{user.studentQrId}</p>
            </details>
          </section>
        ) : (
          <aside className="faculty-note">
            <BookOpen size={34}/>
            <p className="eyebrow">FACULTY WORKSPACE</p>
            <h2>A space<br/>that’s yours.</h2>
            <p className="subtle">Your profile, deadlines, and department records within reach.</p>
            <span className="decor-line"/>
          </aside>
        )}
      </div>

      {/* Fast Roll Number Search & Attendance for Faculty */}
      {!student && (
        <FacultyStudentLookup
          api={api}
          onSelectStudent={(sId)=>{
            setSelectedStudentId(sId);
            setAttendanceModal(true);
          }}
        />
      )}

      {/* Profile Photo & Department/Contact details update */}
      <ProfileDetailsEditor user={user} api={api} onUserUpdated={onUserUpdated}/>

      {/* Account Password & Email Settings */}
      <AccountSettings user={user} api={api} onUserUpdated={onUserUpdated}/>

      {attendanceModal && (
        <AttendanceModal
          api={api}
          initialStudentId={selectedStudentId}
          onClose={()=>{
            setAttendanceModal(false);
            setSelectedStudentId('');
          }}
        />
      )}
    </Shell>
  );
}
