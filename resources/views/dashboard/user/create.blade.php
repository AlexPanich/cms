@extends('layouts.dashboard')

@inject('role', 'App\Role')

@section('content')
    @include('errors.list')
    <form class="" action="{{ route('add_user') }}" method="post">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="name">Логин</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="name" id="name" value="{{ old('name') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="email">E-mail</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="email" name="email" id="email" value="{{ old('email') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="password">Пароль</label>
            <div class="controls">
                <div class="input-prepend">
                    <input class="form-control" type="text" name="password" id="password" value="{{ old('password') }}">
                </div>
            </div>
        </div>
        <div class="control-group">
            <label class="control-label" for="roles">Роли</label>
            <div class="controls">
                <div class="input-prepend">
                    <select name="roles[]" id="roles" multiple>
                        @foreach($role::all() as $role)
                            <option value="{{ $role->id }}"
                            @if(in_array($role->id, old('roles', [])))
                                selected
                            @endif
                            >{{ $role->label }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
        </div>
        <br>
        <input type="submit" value="Создать пользователя" class="btn btn-danger">
    </form>
@endsection