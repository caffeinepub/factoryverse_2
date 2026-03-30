import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type CompanyId = Text;
  type ProjectId = Text;
  type TaskId = Nat;
  type PersonnelId = Text;
  type MachineId = Text;
  type FailureId = Text;
  type DocumentId = Text;
  type HseId = Text;
  type ShipmentId = Text;
  type Timestamp = Int;
  type Code = Text;
  type AssigneeId = Text;
  type DeadLine = Text;
  type CompanyName = Text;
  type ProjectAssignmentId = Text;
  type MaintenancePlanId = Text;
  type ProjectCostId = Text;
  type SupplierId = Text;

  public type Company = {
    id : CompanyId;
    name : Text;
    mode : Text;
    adminCode : Code;
    createdAt : Timestamp;
  };

  public type Personnel = {
    id : PersonnelId;
    companyId : ?CompanyId;
    name : Text;
    role : Text;
    loginCode : Code;
    inviteCode : Code;
    createdAt : Timestamp;
  };

  public type Machine = {
    id : MachineId;
    companyId : CompanyId;
    name : Text;
    machineType : Text;
    serialNumber : Text;
    location : Text;
    status : Text;
    notes : Text;
    createdAt : Timestamp;
  };

  public type Project = {
    id : ProjectId;
    companyId : CompanyId;
    name : Text;
    description : Text;
    status : Text;
    deadline : Text;
    createdAt : Timestamp;
  };

  public type Task = {
    id : TaskId;
    projectId : ProjectId;
    companyId : CompanyId;
    title : Text;
    status : Text;
    assigneeId : AssigneeId;
    dueDate : DeadLine;
  };

  public type TaskNoteId = Text;
  public type TaskNote = {
    id : TaskNoteId;
    taskId : Text;
    companyId : CompanyId;
    content : Text;
    authorName : Text;
    createdAt : Timestamp;
  };

  public type Failure = {
    id : FailureId;
    machineId : MachineId;
    companyId : CompanyId;
    title : Text;
    description : Text;
    severity : Text;
    status : Text;
    reportedBy : Text;
    reportedAt : Timestamp;
    resolvedAt : Text;
  };

  public type FailureWithProject = {
    id : FailureId;
    machineId : MachineId;
    companyId : CompanyId;
    title : Text;
    description : Text;
    severity : Text;
    status : Text;
    reportedBy : Text;
    reportedAt : Timestamp;
    resolvedAt : Text;
    projectId : Text;
  };

  public type Document = {
    id : DocumentId;
    companyId : CompanyId;
    title : Text;
    fileName : Text;
    category : Text;
    uploadedBy : Text;
    createdAt : Timestamp;
  };

  public type HseRecord = {
    id : HseId;
    companyId : CompanyId;
    hseType : Text;
    title : Text;
    description : Text;
    severity : Text;
    status : Text;
    reportedBy : Text;
    createdAt : Timestamp;
  };

  public type Shipment = {
    id : ShipmentId;
    companyId : CompanyId;
    title : Text;
    machineId : Text;
    fromLocation : Text;
    toLocation : Text;
    carrier : Text;
    status : Text;
    shipDate : Text;
    estimatedDelivery : Text;
    notes : Text;
    createdAt : Timestamp;
  };

  public type MaintenancePlan = {
    id : MaintenancePlanId;
    companyId : CompanyId;
    machineId : Text;
    title : Text;
    description : Text;
    frequency : Text;
    nextDate : Text;
    assignedTo : Text;
    status : Text;
    createdAt : Timestamp;
  };

  public type ProjectCost = {
    id : ProjectCostId;
    companyId : CompanyId;
    projectId : ProjectId;
    title : Text;
    category : Text;
    amount : Float;
    currency : Text;
    description : Text;
    createdBy : Text;
    createdAt : Timestamp;
  };

  public type ProjectAssignment = {
    id : ProjectAssignmentId;
    companyId : CompanyId;
    projectId : ProjectId;
    personnelId : PersonnelId;
    personnelName : Text;
    role : Text;
    assignedAt : Timestamp;
  };

  public type Supplier = {
    id : SupplierId;
    companyId : CompanyId;
    name : Text;
    category : Text;
    contactName : Text;
    contactPhone : Text;
    contactEmail : Text;
    address : Text;
    notes : Text;
    status : Text;
    createdAt : Timestamp;
  };

  public type AuthenticatedUser = {
    companyId : ?CompanyId;
    personnelId : ?PersonnelId;
    role : ?Text;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    personnelId : ?PersonnelId;
    companyId : ?CompanyId;
  };

  module Company {
    public func compare(a : Company, b : Company) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  let companies = Map.empty<CompanyId, Company>();
  let personnel = Map.empty<PersonnelId, Personnel>();
  let machines = Map.empty<MachineId, Machine>();
  let projects = Map.empty<ProjectId, Project>();
  let taskStore = Map.empty<TaskId, Task>();
  let taskPriorityStore = Map.empty<Nat, Text>();
  let failureStore = Map.empty<FailureId, Failure>();
  let failureProjectStore = Map.empty<FailureId, Text>();
  let documentStore = Map.empty<DocumentId, Document>();
  let hseStore = Map.empty<HseId, HseRecord>();
  let shipmentStore = Map.empty<ShipmentId, Shipment>();
  let maintenancePlanStore = Map.empty<MaintenancePlanId, MaintenancePlan>();
  let projectCostStore = Map.empty<ProjectCostId, ProjectCost>();
  let projectAssignmentStore = Map.empty<ProjectAssignmentId, ProjectAssignment>();

  let principalToPersonnel = Map.empty<Principal, PersonnelId>();
  let principalToCompany = Map.empty<Principal, CompanyId>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let failureMaintenanceStore = Map.empty<FailureId, MaintenancePlanId>();
  let supplierStore = Map.empty<SupplierId, Supplier>();
  let taskNoteStore = Map.empty<TaskNoteId, TaskNote>();

  var nextCompanyId = 1;
  var nextProjectId = 1;
  var nextTaskId = 1;
  var nextFailureId = 1;
  var nextDocumentId = 1;
  var nextHseId = 1;
  var nextShipmentId = 1;
  var nextMaintenancePlanId = 1;
  var nextProjectCostId = 1;
  var nextProjectAssignmentId = 1;
  var nextSupplierId = 1;
  var nextTaskNoteId = 1;

  func getNextCompanyId() : CompanyId {
    let id = nextCompanyId.toText();
    nextCompanyId += 1;
    id;
  };

  func getNextPersonnelId() : Text {
    Time.now().toText();
  };

  func getNextMachineId() : MachineId {
    Time.now().toText();
  };

  func getNextProjectId() : ProjectId {
    let id = nextProjectId.toText();
    nextProjectId += 1;
    id;
  };

  func getNextTaskId() : TaskId {
    let id = nextTaskId;
    nextTaskId += 1;
    id;
  };

  func getNextFailureId() : FailureId {
    let id = nextFailureId.toText();
    nextFailureId += 1;
    id;
  };

  func getNextDocumentId() : DocumentId {
    let id = nextDocumentId.toText();
    nextDocumentId += 1;
    id;
  };

  func getNextHseId() : HseId {
    let id = nextHseId.toText();
    nextHseId += 1;
    id;
  };

  func getNextShipmentId() : ShipmentId {
    let id = nextShipmentId.toText();
    nextShipmentId += 1;
    id;
  };

  func getNextMaintenancePlanId() : MaintenancePlanId {
    let id = nextMaintenancePlanId.toText();
    nextMaintenancePlanId += 1;
    id;
  };

  func getNextProjectCostId() : ProjectCostId {
    let id = nextProjectCostId.toText();
    nextProjectCostId += 1;
    id;
  };

  func getNextProjectAssignmentId() : ProjectAssignmentId {
    let id = nextProjectAssignmentId.toText();
    nextProjectAssignmentId += 1;
    id;
  };

  func checkCompanyExists(id : CompanyId) : Bool {
    companies.containsKey(id);
  };

  func checkPersonnelExists(id : PersonnelId) : Bool {
    personnel.containsKey(id);
  };

  func checkMachineExists(id : MachineId) : Bool {
    machines.containsKey(id);
  };

  func checkProjectExists(id : ProjectId) : Bool {
    projects.containsKey(id);
  };

  func checkTaskExists(id : TaskId) : Bool {
    taskStore.containsKey(id);
  };

  func getCallerCompanyId(caller : Principal) : ?CompanyId {
    switch (principalToPersonnel.get(caller)) {
      case (?personnelId) {
        switch (personnel.get(personnelId)) {
          case (?person) { person.companyId };
          case null { null };
        };
      };
      case null {
        principalToCompany.get(caller);
      };
    };
  };

  func isCallerCompanyAdmin(caller : Principal, companyId : CompanyId) : Bool {
    switch (principalToCompany.get(caller)) {
      case (?cid) { cid == companyId };
      case null { false };
    };
  };

  func verifyCompanyAccess(caller : Principal, companyId : CompanyId) {
    let callerCompanyId = getCallerCompanyId(caller);
    switch (callerCompanyId) {
      case (?cid) {
        if (cid != companyId) {
          Runtime.trap("Unauthorized: Access denied to this company's data");
        };
      };
      case null {
        Runtime.trap("Unauthorized: No company association found");
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func registerCompany(name : Text, mode : Text) : async {
    id : CompanyId;
    adminCode : Code;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register companies");
    };
    if (name.size() > 30) { Runtime.trap("Company name too long, max 30 chars.") };
    if (mode.size() > 15) { Runtime.trap("Mode too long, max 15 chars.") };
    switch (principalToCompany.get(caller)) {
      case (?_) { Runtime.trap("User already registered a company") };
      case null {};
    };
    let id = getNextCompanyId();
    let adminCode = id.concat("A");
    let company : Company = { id; name; mode; adminCode; createdAt = Time.now() };
    companies.add(id, company);
    principalToCompany.add(caller, id);
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile : UserProfile = { name = profile.name; email = profile.email; personnelId = profile.personnelId; companyId = ?id };
        userProfiles.add(caller, updatedProfile);
      };
      case null {};
    };
    { id; adminCode };
  };

  public shared ({ caller }) func selfRegisterPersonnel(name : Text, role : Text) : async {
    loginCode : Code;
    inviteCode : Code;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register as personnel");
    };
    if (name.size() > 30) { Runtime.trap("Personnel name too long, max 30 chars.") };
    if (role.size() > 15) { Runtime.trap("Role too long, max 15 chars.") };
    switch (principalToPersonnel.get(caller)) {
      case (?_) { Runtime.trap("User already registered as personnel") };
      case null {};
    };
    let id = getNextPersonnelId();
    let loginCode = "LP".concat(id);
    let inviteCode = "GL".concat(id);
    let personnelRecord : Personnel = { id; companyId = null; name; role; loginCode; inviteCode; createdAt = Time.now() };
    if (checkPersonnelExists(id)) { Runtime.trap("Personnel already exists.") };
    personnel.add(id, personnelRecord);
    principalToPersonnel.add(caller, id);
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile : UserProfile = { name = profile.name; email = profile.email; personnelId = ?id; companyId = profile.companyId };
        userProfiles.add(caller, updatedProfile);
      };
      case null {};
    };
    { loginCode; inviteCode };
  };

  public shared ({ caller }) func addPersonnelToCompany(adminCode : Code, inviteCode : Code, role : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add personnel");
    };
    if (role.size() > 15) { Runtime.trap("Role taken, max 15 chars.") };
    let company = companies.values().find(func(comp) { comp.adminCode == adminCode });
    let personnelOption = personnel.values().find(func(pers) { pers.inviteCode == inviteCode });
    switch (company, personnelOption) {
      case (null, _) { Runtime.trap("Company not found") };
      case (_, null) { Runtime.trap("Personnel not found, wrong code. ") };
      case (?company, ?person) {
        if (not isCallerCompanyAdmin(caller, company.id)) {
          Runtime.trap("Unauthorized: Only company admin can add personnel");
        };
        if (person.companyId != null) {
          Runtime.trap("Personnel already assigned to a company.");
        } else {
          let updatedPersonnel : Personnel = { id = person.id; companyId = ?company.id; name = person.name; role; loginCode = person.loginCode; inviteCode = person.inviteCode; createdAt = person.createdAt };
          personnel.add(person.id, updatedPersonnel);
        };
      };
    };
  };

  public query ({ caller }) func authenticate(code : Code) : async ?AuthenticatedUser {
    switch (personnel.values().find(func(user) { user.loginCode == code })) {
      case (?user) {
        ?{ companyId = user.companyId; personnelId = ?user.id; role = ?user.role };
      };
      case (null) {
        switch (companies.values().find(func(comp) { comp.adminCode == code })) {
          case (?company) {
            ?{ companyId = ?company.id; personnelId = null; role = ?"admin" };
          };
          case (null) { Runtime.trap("Invalid code.") };
        };
      };
    };
  };

  public shared ({ caller }) func addMachine(companyId : Text, name : Text, machineType : Text, serialNumber : Text, location : Text, notes : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add machines");
    };
    verifyCompanyAccess(caller, companyId);
    if (not checkCompanyExists(companyId)) { Runtime.trap("Company not existant.") };
    let id = getNextMachineId();
    let machine : Machine = { id; companyId; name; machineType; serialNumber; location; status = "active"; notes; createdAt = Time.now() };
    machines.add(id, machine);
    id;
  };

  public shared ({ caller }) func updateMachineStatus(machineId : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update machines");
    };
    if (not checkMachineExists(machineId)) { Runtime.trap("Machine does not exist.") };
    if (status.size() > 20) { Runtime.trap("Status too long, max 20 chars.") };
    switch (machines.get(machineId)) {
      case (null) { Runtime.trap("Machine does not exist.") };
      case (?machine) {
        verifyCompanyAccess(caller, machine.companyId);
        let updatedMachine : Machine = { id = machine.id; companyId = machine.companyId; name = machine.name; machineType = machine.machineType; serialNumber = machine.serialNumber; location = machine.location; status; notes = machine.notes; createdAt = machine.createdAt };
        machines.add(machineId, updatedMachine);
      };
    };
  };

  public query ({ caller }) func listMachines(companyId : Text) : async [Machine] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list machines");
    };
    verifyCompanyAccess(caller, companyId);
    if (not checkCompanyExists(companyId)) { Runtime.trap("Company does not exist.") };
    machines.values().toArray().filter(func(machine) { machine.companyId == companyId });
  };

  public shared ({ caller }) func createProject(companyId : Text, name : Text, description : Text, deadline : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create projects");
    };
    verifyCompanyAccess(caller, companyId);
    if (not checkCompanyExists(companyId)) { Runtime.trap("Company does not exist.") };
    if (name.size() > 30) { Runtime.trap("Project name too long, max 30 chars.") };
    if (description.size() > 50) { Runtime.trap("Description too long, max 50 chars.") };
    let id = getNextProjectId();
    let project : Project = { id; companyId; name; description; status = "pending"; deadline; createdAt = Time.now() };
    projects.add(id, project);
    id;
  };

  public query ({ caller }) func listProjects(companyId : Text) : async [Project] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list projects");
    };
    verifyCompanyAccess(caller, companyId);
    if (not checkCompanyExists(companyId)) { Runtime.trap("Company does not exist.") };
    projects.values().toArray().filter(func(project) { project.companyId == companyId });
  };


  public shared ({ caller }) func updateProjectStatus(projectId : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update project status");
    };
    switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found.") };
      case (?project) {
        verifyCompanyAccess(caller, project.companyId);
        let updated : Project = { id = project.id; companyId = project.companyId; name = project.name; description = project.description; status; deadline = project.deadline; createdAt = project.createdAt };
        projects.add(projectId, updated);
      };
    };
  };

  public shared ({ caller }) func addTask(projectId : Text, companyId : Text, title : Text, assigneeId : Text, dueDate : Text, priority : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add tasks");
    };
    verifyCompanyAccess(caller, companyId);
    if (not checkProjectExists(projectId)) { Runtime.trap("Project does not exist.") };
    if (title.size() > 50) { Runtime.trap("Task title too long, max 50 chars.") };
    switch (projects.get(projectId)) {
      case (?project) {
        if (project.companyId != companyId) { Runtime.trap("Project does not belong to this company") };
      };
      case null { Runtime.trap("Project does not exist.") };
    };
    let id = getNextTaskId();
    let p = if (priority == "") "medium" else priority;
    let task : Task = { id; projectId; companyId; title; status = "pending"; assigneeId; dueDate };
    taskStore.add(id, task);
    taskPriorityStore.add(id, p);
    id;
  };

  public query ({ caller }) func listTasks(projectId : Text) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list tasks");
    };
    if (not checkProjectExists(projectId)) { Runtime.trap("Project does not exist.") };
    switch (projects.get(projectId)) {
      case (?project) { verifyCompanyAccess(caller, project.companyId) };
      case null { Runtime.trap("Project does not exist.") };
    };
    taskStore.values().toArray().filter(func(task) { task.projectId == projectId });
  };

  public shared ({ caller }) func addFailure(machineId : Text, companyId : Text, title : Text, description : Text, severity : Text, reportedBy : Text, projectId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can report failures");
    };
    verifyCompanyAccess(caller, companyId);
    if (title.size() > 50) { Runtime.trap("Title too long, max 50 chars.") };
    if (description.size() > 200) { Runtime.trap("Description too long, max 200 chars.") };
    let id = getNextFailureId();
    let failure : Failure = { id; machineId; companyId; title; description; severity; status = "open"; reportedBy; reportedAt = Time.now(); resolvedAt = "" };
    failureStore.add(id, failure);
    if (projectId != "") { failureProjectStore.add(id, projectId) };
    id;
  };

  public query ({ caller }) func listFailures(companyId : Text) : async [FailureWithProject] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list failures");
    };
    verifyCompanyAccess(caller, companyId);
    failureStore.values().toArray()
      .filter(func(f) { f.companyId == companyId })
      .map(func(f : Failure) : FailureWithProject {
        let projId = switch (failureProjectStore.get(f.id)) {
          case (?pid) { pid };
          case null { "" };
        };
        { id = f.id; machineId = f.machineId; companyId = f.companyId; title = f.title; description = f.description; severity = f.severity; status = f.status; reportedBy = f.reportedBy; reportedAt = f.reportedAt; resolvedAt = f.resolvedAt; projectId = projId }
      });
  };

  public shared ({ caller }) func updateFailureStatus(failureId : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update failure status");
    };
    switch (failureStore.get(failureId)) {
      case (null) { Runtime.trap("Failure record not found.") };
      case (?failure) {
        verifyCompanyAccess(caller, failure.companyId);
        let resolvedAt = if (status == "resolved") { Time.now().toText() } else { failure.resolvedAt };
        let updated : Failure = { id = failure.id; machineId = failure.machineId; companyId = failure.companyId; title = failure.title; description = failure.description; severity = failure.severity; status; reportedBy = failure.reportedBy; reportedAt = failure.reportedAt; resolvedAt };
        failureStore.add(failureId, updated);
      };
    };
  };

  // Document Management
  public shared ({ caller }) func addDocument(companyId : Text, title : Text, fileName : Text, category : Text, uploadedBy : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add documents");
    };
    verifyCompanyAccess(caller, companyId);
    if (title.size() > 50) { Runtime.trap("Title too long, max 50 chars.") };
    if (fileName.size() > 100) { Runtime.trap("File name too long, max 100 chars.") };
    let id = getNextDocumentId();
    let doc : Document = { id; companyId; title; fileName; category; uploadedBy; createdAt = Time.now() };
    documentStore.add(id, doc);
    id;
  };

  public query ({ caller }) func listDocuments(companyId : Text) : async [Document] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list documents");
    };
    verifyCompanyAccess(caller, companyId);
    documentStore.values().toArray().filter(func(d) { d.companyId == companyId });
  };

  public shared ({ caller }) func deleteDocument(documentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete documents");
    };
    switch (documentStore.get(documentId)) {
      case (null) { Runtime.trap("Document not found.") };
      case (?doc) {
        verifyCompanyAccess(caller, doc.companyId);
        documentStore.remove(documentId);
      };
    };
  };

  // HSE Module
  public shared ({ caller }) func addHseRecord(companyId : Text, hseType : Text, title : Text, description : Text, severity : Text, reportedBy : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add HSE records");
    };
    verifyCompanyAccess(caller, companyId);
    if (title.size() > 80) { Runtime.trap("Title too long, max 80 chars.") };
    if (description.size() > 300) { Runtime.trap("Description too long, max 300 chars.") };
    let id = getNextHseId();
    let record : HseRecord = { id; companyId; hseType; title; description; severity; status = "open"; reportedBy; createdAt = Time.now() };
    hseStore.add(id, record);
    id;
  };

  public query ({ caller }) func listHseRecords(companyId : Text) : async [HseRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list HSE records");
    };
    verifyCompanyAccess(caller, companyId);
    hseStore.values().toArray().filter(func(h) { h.companyId == companyId });
  };

  public shared ({ caller }) func updateHseStatus(hseId : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update HSE status");
    };
    switch (hseStore.get(hseId)) {
      case (null) { Runtime.trap("HSE record not found.") };
      case (?record) {
        verifyCompanyAccess(caller, record.companyId);
        let updated : HseRecord = { id = record.id; companyId = record.companyId; hseType = record.hseType; title = record.title; description = record.description; severity = record.severity; status; reportedBy = record.reportedBy; createdAt = record.createdAt };
        hseStore.add(hseId, updated);
      };
    };
  };

  // Logistics / Shipment Module
  public shared ({ caller }) func addShipment(companyId : Text, title : Text, machineId : Text, fromLocation : Text, toLocation : Text, carrier : Text, shipDate : Text, estimatedDelivery : Text, notes : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add shipments");
    };
    verifyCompanyAccess(caller, companyId);
    if (title.size() > 80) { Runtime.trap("Title too long, max 80 chars.") };
    let id = getNextShipmentId();
    let shipment : Shipment = { id; companyId; title; machineId; fromLocation; toLocation; carrier; status = "planned"; shipDate; estimatedDelivery; notes; createdAt = Time.now() };
    shipmentStore.add(id, shipment);
    id;
  };

  public query ({ caller }) func listShipments(companyId : Text) : async [Shipment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list shipments");
    };
    verifyCompanyAccess(caller, companyId);
    shipmentStore.values().toArray().filter(func(s) { s.companyId == companyId });
  };

  public shared ({ caller }) func updateShipmentStatus(shipmentId : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update shipment status");
    };
    switch (shipmentStore.get(shipmentId)) {
      case (null) { Runtime.trap("Shipment not found.") };
      case (?shipment) {
        verifyCompanyAccess(caller, shipment.companyId);
        let updated : Shipment = { id = shipment.id; companyId = shipment.companyId; title = shipment.title; machineId = shipment.machineId; fromLocation = shipment.fromLocation; toLocation = shipment.toLocation; carrier = shipment.carrier; status; shipDate = shipment.shipDate; estimatedDelivery = shipment.estimatedDelivery; notes = shipment.notes; createdAt = shipment.createdAt };
        shipmentStore.add(shipmentId, updated);
      };
    };
  };

  // Preventive Maintenance Plan Module
  public shared ({ caller }) func addMaintenancePlan(companyId : Text, machineId : Text, title : Text, description : Text, frequency : Text, nextDate : Text, assignedTo : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add maintenance plans");
    };
    verifyCompanyAccess(caller, companyId);
    if (title.size() > 80) { Runtime.trap("Title too long, max 80 chars.") };
    if (description.size() > 300) { Runtime.trap("Description too long, max 300 chars.") };
    let id = getNextMaintenancePlanId();
    let plan : MaintenancePlan = { id; companyId; machineId; title; description; frequency; nextDate; assignedTo; status = "active"; createdAt = Time.now() };
    maintenancePlanStore.add(id, plan);
    id;
  };

  public query ({ caller }) func listMaintenancePlans(companyId : Text) : async [MaintenancePlan] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list maintenance plans");
    };
    verifyCompanyAccess(caller, companyId);
    maintenancePlanStore.values().toArray().filter(func(p) { p.companyId == companyId });
  };

  public shared ({ caller }) func updateMaintenancePlanStatus(planId : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update maintenance plan status");
    };
    switch (maintenancePlanStore.get(planId)) {
      case (null) { Runtime.trap("Maintenance plan not found.") };
      case (?plan) {
        verifyCompanyAccess(caller, plan.companyId);
        let updated : MaintenancePlan = { id = plan.id; companyId = plan.companyId; machineId = plan.machineId; title = plan.title; description = plan.description; frequency = plan.frequency; nextDate = plan.nextDate; assignedTo = plan.assignedTo; status; createdAt = plan.createdAt };
        maintenancePlanStore.add(planId, updated);
      };
    };
  };

  // Project Cost Module
  public shared ({ caller }) func addProjectCost(companyId : Text, projectId : Text, title : Text, category : Text, amount : Float, currency : Text, description : Text, createdBy : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add cost records");
    };
    verifyCompanyAccess(caller, companyId);
    if (title.size() > 80) { Runtime.trap("Title too long, max 80 chars.") };
    let id = getNextProjectCostId();
    let cost : ProjectCost = { id; companyId; projectId; title; category; amount; currency; description; createdBy; createdAt = Time.now() };
    projectCostStore.add(id, cost);
    id;
  };

  public query ({ caller }) func listProjectCosts(companyId : Text) : async [ProjectCost] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list cost records");
    };
    verifyCompanyAccess(caller, companyId);
    projectCostStore.values().toArray().filter(func(c) { c.companyId == companyId });
  };

  public shared ({ caller }) func deleteProjectCost(costId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete cost records");
    };
    switch (projectCostStore.get(costId)) {
      case (null) { Runtime.trap("Cost record not found.") };
      case (?cost) {
        verifyCompanyAccess(caller, cost.companyId);
        projectCostStore.remove(costId);
      };
    };
  };

  // Project Assignment Module
  public shared ({ caller }) func assignPersonnelToProject(companyId : Text, projectId : Text, personnelId : Text, role : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can assign personnel");
    };
    verifyCompanyAccess(caller, companyId);
    if (not checkProjectExists(projectId)) { Runtime.trap("Project does not exist.") };
    // Check for duplicate assignment
    let existing = projectAssignmentStore.values().find(func(a) {
      a.projectId == projectId and a.personnelId == personnelId
    });
    switch (existing) {
      case (?_) { Runtime.trap("Personnel already assigned to this project.") };
      case null {};
    };
    let personnelName = switch (personnel.get(personnelId)) {
      case (?p) { p.name };
      case null { personnelId };
    };
    let id = getNextProjectAssignmentId();
    let assignment : ProjectAssignment = { id; companyId; projectId; personnelId; personnelName; role; assignedAt = Time.now() };
    projectAssignmentStore.add(id, assignment);
    id;
  };

  public shared ({ caller }) func removePersonnelFromProject(assignmentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can remove assignments");
    };
    switch (projectAssignmentStore.get(assignmentId)) {
      case (null) { Runtime.trap("Assignment not found.") };
      case (?assignment) {
        verifyCompanyAccess(caller, assignment.companyId);
        projectAssignmentStore.remove(assignmentId);
      };
    };
  };

  public query ({ caller }) func listProjectAssignments(projectId : Text) : async [ProjectAssignment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list assignments");
    };
    switch (projects.get(projectId)) {
      case (?project) { verifyCompanyAccess(caller, project.companyId) };
      case null { Runtime.trap("Project does not exist.") };
    };
    projectAssignmentStore.values().toArray().filter(func(a) { a.projectId == projectId });
  };

  public query ({ caller }) func listCompanyPersonnel(companyId : Text) : async [Personnel] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list personnel");
    };
    verifyCompanyAccess(caller, companyId);
    personnel.values().toArray().filter(func(p) {
      switch (p.companyId) {
        case (?cid) { cid == companyId };
        case null { false };
      };
    });
  };

  // New functions from user request

  public shared ({ caller }) func updateTaskStatus(taskId : Nat, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update task status");
    };
    switch (taskStore.get(taskId)) {
      case (null) { Runtime.trap("Task not found.") };
      case (?task) {
        verifyCompanyAccess(caller, task.companyId);
        let updated : Task = { task with status };
        taskStore.add(taskId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteTask(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete tasks");
    };
    switch (taskStore.get(taskId)) {
      case (null) { Runtime.trap("Task not found.") };
      case (?task) {
        verifyCompanyAccess(caller, task.companyId);
        taskStore.remove(taskId);
      };
    };
  };

  public shared ({ caller }) func updateMachine(machineId : Text, name : Text, machineType : Text, serialNumber : Text, location : Text, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update machine details");
    };
    switch (machines.get(machineId)) {
      case (null) { Runtime.trap("Machine not found.") };
      case (?machine) {
        verifyCompanyAccess(caller, machine.companyId);
        let updated : Machine = { machine with name; machineType; serialNumber; location; notes };
        machines.add(machineId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteMachine(machineId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete machines");
    };
    switch (machines.get(machineId)) {
      case (null) { Runtime.trap("Machine not found.") };
      case (?machine) {
        verifyCompanyAccess(caller, machine.companyId);
        machines.remove(machineId);
      };
    };
  };

  public shared ({ caller }) func linkFailureMaintenance(failureId : Text, maintenancePlanId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can link failures to maintenance plans");
    };

    switch (failureStore.get(failureId)) {
      case (null) { Runtime.trap("Failure record not found.") };
      case (?failure) {
        verifyCompanyAccess(caller, failure.companyId);
        
        // Verify maintenance plan exists and belongs to same company
        switch (maintenancePlanStore.get(maintenancePlanId)) {
          case (null) { Runtime.trap("Maintenance plan not found.") };
          case (?plan) {
            if (plan.companyId != failure.companyId) {
              Runtime.trap("Unauthorized: Maintenance plan does not belong to the same company");
            };
            failureMaintenanceStore.add(failureId, maintenancePlanId);
          };
        };
      };
    };
  };

  public query ({ caller }) func getFailureMaintenance(failureId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get linked maintenance plans");
    };

    switch (failureStore.get(failureId)) {
      case (null) { Runtime.trap("Failure record not found.") };
      case (?failure) {
        verifyCompanyAccess(caller, failure.companyId);
        switch (failureMaintenanceStore.get(failureId)) {
          case (?maintenancePlanId) { maintenancePlanId };
          case null { "" };
        };
      };
    };
  };

  func getNextSupplierId() : SupplierId {
    let id = "sup-" # nextSupplierId.toText();
    nextSupplierId += 1;
    id;
  };

  // Personnel update/delete
  public shared ({ caller }) func updatePersonnel(personnelId : Text, name : Text, role : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (personnel.get(personnelId)) {
      case (null) { Runtime.trap("Personnel not found.") };
      case (?p) {
        verifyCompanyAccess(caller, switch (p.companyId) { case (?cid) cid; case null "" });
        let updated : Personnel = { p with name; role };
        personnel.add(personnelId, updated);
      };
    };
  };

  public shared ({ caller }) func deletePersonnel(personnelId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (personnel.get(personnelId)) {
      case (null) { Runtime.trap("Personnel not found.") };
      case (?p) {
        verifyCompanyAccess(caller, switch (p.companyId) { case (?cid) cid; case null "" });
        personnel.remove(personnelId);
      };
    };
  };

  // Task update
  public shared ({ caller }) func updateTask(taskId : Nat, title : Text, assigneeId : Text, dueDate : Text, priority : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (taskStore.get(taskId)) {
      case (null) { Runtime.trap("Task not found.") };
      case (?task) {
        verifyCompanyAccess(caller, task.companyId);
        let updated : Task = { task with title; assigneeId; dueDate };
        taskStore.add(taskId, updated);
        if (priority != "") { taskPriorityStore.add(taskId, priority) };
      };
    };
  };

  // List all company tasks
  public query ({ caller }) func listAllTasks(companyId : Text) : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    verifyCompanyAccess(caller, companyId);
    taskStore.values().toArray().filter(func(t) { t.companyId == companyId });
  };

  // Resolve failure with note
  public shared ({ caller }) func resolveFailure(failureId : Text, resolutionNote : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (failureStore.get(failureId)) {
      case (null) { Runtime.trap("Failure not found.") };
      case (?failure) {
        verifyCompanyAccess(caller, failure.companyId);
        let resolvedAt = resolutionNote # "|" # Time.now().toText();
        let updated : Failure = { failure with status = "resolved"; resolvedAt };
        failureStore.add(failureId, updated);
      };
    };
  };

  // Supplier module
  public shared ({ caller }) func addSupplier(companyId : Text, name : Text, category : Text, contactName : Text, contactPhone : Text, contactEmail : Text, address : Text, notes : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    verifyCompanyAccess(caller, companyId);
    if (name.size() > 80) { Runtime.trap("Name too long, max 80 chars.") };
    let id = getNextSupplierId();
    let supplier : Supplier = { id; companyId; name; category; contactName; contactPhone; contactEmail; address; notes; status = "active"; createdAt = Time.now() };
    supplierStore.add(id, supplier);
    id;
  };

  public query ({ caller }) func listSuppliers(companyId : Text) : async [Supplier] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    verifyCompanyAccess(caller, companyId);
    supplierStore.values().toArray().filter(func(s) { s.companyId == companyId });
  };

  public shared ({ caller }) func updateSupplier(supplierId : Text, name : Text, category : Text, contactName : Text, contactPhone : Text, contactEmail : Text, address : Text, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (supplierStore.get(supplierId)) {
      case (null) { Runtime.trap("Supplier not found.") };
      case (?s) {
        verifyCompanyAccess(caller, s.companyId);
        let updated : Supplier = { s with name; category; contactName; contactPhone; contactEmail; address; notes };
        supplierStore.add(supplierId, updated);
      };
    };
  };

  public shared ({ caller }) func updateSupplierStatus(supplierId : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (supplierStore.get(supplierId)) {
      case (null) { Runtime.trap("Supplier not found.") };
      case (?s) {
        verifyCompanyAccess(caller, s.companyId);
        let updated : Supplier = { s with status };
        supplierStore.add(supplierId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteSupplier(supplierId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (supplierStore.get(supplierId)) {
      case (null) { Runtime.trap("Supplier not found.") };
      case (?s) {
        verifyCompanyAccess(caller, s.companyId);
        supplierStore.remove(supplierId);
      };
    };
  };

  // ===== Sürüm 23 Additions =====

  // Shipment update/delete
  public shared ({ caller }) func updateShipment(shipmentId : Text, title : Text, machineId : Text, fromLocation : Text, toLocation : Text, carrier : Text, shipDate : Text, estimatedDelivery : Text, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (shipmentStore.get(shipmentId)) {
      case (null) { Runtime.trap("Shipment not found.") };
      case (?s) {
        verifyCompanyAccess(caller, s.companyId);
        let updated : Shipment = { s with title; machineId; fromLocation; toLocation; carrier; shipDate; estimatedDelivery; notes };
        shipmentStore.add(shipmentId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteShipment(shipmentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (shipmentStore.get(shipmentId)) {
      case (null) { Runtime.trap("Shipment not found.") };
      case (?s) {
        verifyCompanyAccess(caller, s.companyId);
        shipmentStore.remove(shipmentId);
      };
    };
  };

  // HSE update/delete
  public shared ({ caller }) func updateHseRecord(hseId : Text, hseType : Text, title : Text, description : Text, severity : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (hseStore.get(hseId)) {
      case (null) { Runtime.trap("HSE record not found.") };
      case (?r) {
        verifyCompanyAccess(caller, r.companyId);
        let updated : HseRecord = { r with hseType; title; description; severity };
        hseStore.add(hseId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteHseRecord(hseId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (hseStore.get(hseId)) {
      case (null) { Runtime.trap("HSE record not found.") };
      case (?r) {
        verifyCompanyAccess(caller, r.companyId);
        hseStore.remove(hseId);
      };
    };
  };

  // MaintenancePlan update/delete
  public shared ({ caller }) func updateMaintenancePlan(planId : Text, title : Text, description : Text, frequency : Text, nextDate : Text, assignedTo : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (maintenancePlanStore.get(planId)) {
      case (null) { Runtime.trap("Maintenance plan not found.") };
      case (?p) {
        verifyCompanyAccess(caller, p.companyId);
        let updated : MaintenancePlan = { p with title; description; frequency; nextDate; assignedTo };
        maintenancePlanStore.add(planId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteMaintenancePlan(planId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (maintenancePlanStore.get(planId)) {
      case (null) { Runtime.trap("Maintenance plan not found.") };
      case (?p) {
        verifyCompanyAccess(caller, p.companyId);
        maintenancePlanStore.remove(planId);
      };
    };
  };

  // Document update
  public shared ({ caller }) func updateDocument(documentId : Text, title : Text, fileName : Text, category : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (documentStore.get(documentId)) {
      case (null) { Runtime.trap("Document not found.") };
      case (?d) {
        verifyCompanyAccess(caller, d.companyId);
        let updated : Document = { d with title; fileName; category };
        documentStore.add(documentId, updated);
      };
    };
  };

  // ProjectCost update
  public shared ({ caller }) func updateProjectCost(costId : Text, title : Text, category : Text, amount : Float, currency : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (projectCostStore.get(costId)) {
      case (null) { Runtime.trap("Cost record not found.") };
      case (?c) {
        verifyCompanyAccess(caller, c.companyId);
        let updated : ProjectCost = { c with title; category; amount; currency; description };
        projectCostStore.add(costId, updated);
      };
    };
  };

  // ===== Sürüm 24 Additions =====

  // Separate store for maintenance plan → project linking
  let maintenancePlanProjectStore = Map.empty<MaintenancePlanId, ProjectId>();

  // Update project details
  public shared ({ caller }) func updateProject(projectId : Text, name : Text, description : Text, deadline : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found.") };
      case (?p) {
        verifyCompanyAccess(caller, p.companyId);
        let updated : Project = { p with name; description; deadline };
        projects.add(projectId, updated);
      };
    };
  };

  // Delete project
  public shared ({ caller }) func deleteProject(projectId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (projects.get(projectId)) {
      case (null) { Runtime.trap("Project not found.") };
      case (?p) {
        verifyCompanyAccess(caller, p.companyId);
        projects.remove(projectId);
      };
    };
  };

  // Link maintenance plan to project
  public shared ({ caller }) func linkMaintenancePlanToProject(planId : Text, projectId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (maintenancePlanStore.get(planId)) {
      case (null) { Runtime.trap("Maintenance plan not found.") };
      case (?plan) {
        verifyCompanyAccess(caller, plan.companyId);
        maintenancePlanProjectStore.add(planId, projectId);
      };
    };
  };

  // Get project linked to maintenance plan
  public query ({ caller }) func getMaintenancePlanProject(planId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (maintenancePlanProjectStore.get(planId)) {
      case (null) { "" };
      case (?pid) { pid };
    };
  };

  // Update failure record
  public shared ({ caller }) func updateFailure(failureId : Text, title : Text, description : Text, severity : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (failureStore.get(failureId)) {
      case (null) { Runtime.trap("Failure not found.") };
      case (?f) {
        verifyCompanyAccess(caller, f.companyId);
        let updated : Failure = { f with title; description; severity };
        failureStore.add(failureId, updated);
      };
    };
  };

  // Delete failure record
  public shared ({ caller }) func deleteFailure(failureId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (failureStore.get(failureId)) {
      case (null) { Runtime.trap("Failure not found.") };
      case (?f) {
        verifyCompanyAccess(caller, f.companyId);
        failureStore.remove(failureId);
      };
    };
  };

  // Update project cost (already in Sürüm 23 backend.d.ts but verify in main.mo)
  // List maintenance plans with project info (returns planId and projectId pairs)
  public query ({ caller }) func listMaintenancePlanProjects(companyId : Text) : async [(Text, Text)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    verifyCompanyAccess(caller, companyId);
    maintenancePlanProjectStore.entries().toArray();
  };

  // Task Priorities
  public query ({ caller }) func listTaskPriorities(companyId : Text) : async [(Nat, Text)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    verifyCompanyAccess(caller, companyId);
    taskStore.values().toArray()
      .filter(func(t) { t.companyId == companyId })
      .map(func(t) {
        let prio = switch (taskPriorityStore.get(t.id)) {
          case (?p) { p };
          case null { "medium" };
        };
        (t.id, prio);
      });
  };

  // Task Notes
  public shared ({ caller }) func addTaskNote(taskId : Text, companyId : Text, content : Text, authorName : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    verifyCompanyAccess(caller, companyId);
    if (content.size() > 300) { Runtime.trap("Note too long, max 300 chars.") };
    let id = nextTaskNoteId.toText();
    nextTaskNoteId += 1;
    let note : TaskNote = { id; taskId; companyId; content; authorName; createdAt = Time.now() };
    taskNoteStore.add(id, note);
    id;
  };

  public query ({ caller }) func listTaskNotes(taskId : Text) : async [TaskNote] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    taskNoteStore.values().toArray().filter(func(n) { n.taskId == taskId });
  };

  // Reset personnel login code
  public shared ({ caller }) func resetPersonnelLoginCode(personnelId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (personnel.get(personnelId)) {
      case (null) { Runtime.trap("Personnel not found.") };
      case (?p) {
        switch (p.companyId) {
          case (null) { Runtime.trap("Personnel not in a company.") };
          case (?cid) {
            verifyCompanyAccess(caller, cid);
            let newCode = "LP" # Time.now().toText();
            let updated : Personnel = { p with loginCode = newCode };
            personnel.add(personnelId, updated);
            newCode;
          };
        };
      };
    };
  };

};
