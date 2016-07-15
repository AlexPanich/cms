@extends('layouts.dashboard')

@inject('permission', 'App\Permission')

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('update_role', $role->id) }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="name">Название</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="name" id="name" value="{{ old('name', $role->name) }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="label">Описание</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="label" id="label" value="{{ old('label', $role->label) }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="permissions">Привелегии</label>
            <div class="controls">
                <div class="input-prepend">
                    <select name="permissions[]" id="permissions" multiple>
                        @foreach($permission::all() as $permission)
                            <option value="{{ $permission->id }}"
                                    @if(in_array($permission->id, old('permission', $role->permissions->keyBy('id')->keys()->all())))
                                    selected
                                    @endif
                            >{{ $permission->label }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
        </div>
        <br>
        <input type="submit" value="Создать роль" class="btn btn-danger">
    </form>
@endsection