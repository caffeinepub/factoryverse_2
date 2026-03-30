import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldActor = {
    taskStore : Map.Map<Nat, { id : Nat; projectId : Text; companyId : Text; title : Text; status : Text; assigneeId : Text; dueDate : Text }>;
  };

  type NewActor = {
    taskStore : Map.Map<Nat, { id : Nat; projectId : Text; companyId : Text; title : Text; status : Text; assigneeId : Text; dueDate : Text }>;
    failureMaintenanceStore : Map.Map<Text, Text>;
  };

  public func run(old : OldActor) : NewActor {
    {
      taskStore = old.taskStore;
      failureMaintenanceStore = Map.empty<Text, Text>();
    };
  };
};
